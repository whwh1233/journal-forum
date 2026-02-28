const { getDB } = require('../config/databaseLowdb');
const { customAlphabet } = require('nanoid');
const badgeService = require('../services/badgeService');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

// 递归构建评论树（最多3层）
const buildCommentTree = (comments, parentId = null, level = 0) => {
  if (level >= 3) return [];

  return comments
    .filter(comment => comment.parentId === parentId)
    .map(comment => ({
      ...comment,
      replies: level < 2 ? buildCommentTree(comments, comment.id, level + 1) : []
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// 获取期刊的所有评论
const getCommentsByJournalId = async (req, res) => {
  try {
    const { journalId } = req.params;
    const { sort = 'newest' } = req.query;
    const db = getDB();

    // 获取该期刊的所有评论
    const comments = db.data.comments
      .filter(c => c.journalId === parseInt(journalId));

    // 构建评论树
    let commentTree = buildCommentTree(comments);

    // 排序
    if (sort === 'oldest') {
      commentTree.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'rating') {
      commentTree.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    res.json(commentTree);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: '获取评论失败' });
  }
};

// 创建评论或回复
const createComment = async (req, res) => {
  try {
    const { journalId, parentId, content, rating } = req.body;
    const db = getDB();

    // 验证期刊是否存在
    const journal = db.data.journals.find(j => j.id === parseInt(journalId));
    if (!journal) {
      return res.status(404).json({ message: '期刊不存在' });
    }

    // 如果是回复，验证父评论是否存在
    if (parentId) {
      const parentComment = db.data.comments.find(c => c.id === parentId);
      if (!parentComment) {
        return res.status(404).json({ message: '父评论不存在' });
      }

      // 检查层级（不允许超过3层）
      const getCommentLevel = (commentId, level = 0) => {
        const comment = db.data.comments.find(c => c.id === commentId);
        if (!comment || !comment.parentId || level >= 3) return level;
        return getCommentLevel(comment.parentId, level + 1);
      };

      if (getCommentLevel(parentId) >= 2) {
        return res.status(400).json({ message: '评论层级不能超过3层' });
      }
    }

    // 验证顶级评论必须有评分
    if (!parentId && (rating === undefined || rating === null)) {
      return res.status(400).json({ message: '顶级评论必须包含评分' });
    }

    // 验证评分范围
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: '评分必须在1-5之间' });
    }

    // 创建评论ID
    const timestamp = Date.now();
    const commentId = `${journalId}-${timestamp}-${nanoid()}`;

    const newComment = {
      id: commentId,
      userId: req.user.id,
      userName: req.user.name || req.user.email.split('@')[0],
      journalId: parseInt(journalId),
      parentId: parentId || null,
      content,
      rating: parentId ? undefined : rating,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    db.data.comments.push(newComment);
    await db.write();

    // 如果是顶级评论，更新期刊评分
    if (!parentId) {
      const topLevelComments = db.data.comments.filter(
        c => c.journalId === parseInt(journalId) && !c.parentId && !c.isDeleted && c.rating
      );

      if (topLevelComments.length > 0) {
        const avgRating = topLevelComments.reduce((sum, c) => sum + c.rating, 0) / topLevelComments.length;
        journal.rating = Math.round(avgRating * 10) / 10;
        await db.write();
      }
    }

    // 检查评论徽章
    let newBadges = [];
    try {
      newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'commentCount');
    } catch (err) {
      console.error('Badge check failed:', err);
    }

    res.status(201).json({
      ...newComment,
      newBadges: newBadges.length > 0 ? newBadges : undefined
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: '创建评论失败' });
  }
};

// 更新评论
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const db = getDB();

    const comment = db.data.comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 只有作者可以编辑
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: '只能编辑自己的评论' });
    }

    if (comment.isDeleted) {
      return res.status(400).json({ message: '已删除的评论无法编辑' });
    }

    comment.content = content;
    comment.updatedAt = new Date().toISOString();

    await db.write();

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: '更新评论失败' });
  }
};

// 删除评论（软删除）
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const db = getDB();

    const comment = db.data.comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 作者或管理员可以删除
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有删除权限' });
    }

    comment.isDeleted = true;
    comment.content = '[该评论已被删除]';
    comment.updatedAt = new Date().toISOString();

    await db.write();

    // 如果是顶级评论，重新计算期刊评分
    if (!comment.parentId) {
      const journal = db.data.journals.find(j => j.id === comment.journalId);
      if (journal) {
        const topLevelComments = db.data.comments.filter(
          c => c.journalId === comment.journalId && !c.parentId && !c.isDeleted && c.rating
        );

        if (topLevelComments.length > 0) {
          const avgRating = topLevelComments.reduce((sum, c) => sum + c.rating, 0) / topLevelComments.length;
          journal.rating = Math.round(avgRating * 10) / 10;
        } else {
          journal.rating = 0;
        }
        await db.write();
      }
    }

    res.json({ message: '评论已删除', comment });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: '删除评论失败' });
  }
};

module.exports = {
  getCommentsByJournalId,
  createComment,
  updateComment,
  deleteComment
};
