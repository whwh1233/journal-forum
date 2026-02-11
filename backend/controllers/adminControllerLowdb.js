const { getDB } = require('../config/databaseLowdb');

// 获取统计数据
const getStats = async (req, res, next) => {
  try {
    const db = getDB();

    const userCount = db.data.users.length;
    const journalCount = db.data.journals.length;

    // 计算评论总数
    let commentCount = 0;
    db.data.journals.forEach(journal => {
      commentCount += journal.reviews ? journal.reviews.length : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        userCount,
        journalCount,
        commentCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户列表
const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const db = getDB();

    let userList = db.data.users.map(user => {
      // 计算用户评论数
      let commentCount = 0;
      db.data.journals.forEach(journal => {
        if (journal.reviews) {
          commentCount += journal.reviews.filter(r => r.author === user.email).length;
        }
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.createdAt,
        commentCount
      };
    });

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      userList = userList.filter(user =>
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // 分页
    const skip = (page - 1) * limit;
    const total = userList.length;
    const paginatedUsers = userList.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户（禁用/启用）
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();

    const userIndex = db.data.users.findIndex(u => u.id === Number(id));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }

    // 不能禁用管理员
    if (db.data.users[userIndex].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: '不能禁用管理员账号'
      });
    }

    db.data.users[userIndex].status = status;
    await db.write();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: db.data.users[userIndex].id,
          email: db.data.users[userIndex].email,
          status: db.data.users[userIndex].status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const userIndex = db.data.users.findIndex(u => u.id === Number(id));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }

    // 不能删除管理员
    if (db.data.users[userIndex].role === 'admin') {
      return res.status(400).json({
        success: false,
        message: '不能删除管理员账号'
      });
    }

    const userEmail = db.data.users[userIndex].email;

    // 删除用户的所有评论
    db.data.journals.forEach(journal => {
      if (journal.reviews) {
        journal.reviews = journal.reviews.filter(r => r.author !== userEmail);
        // 重新计算平均评分
        if (journal.reviews.length > 0) {
          const totalRating = journal.reviews.reduce((sum, review) => sum + review.rating, 0);
          journal.rating = Math.round((totalRating / journal.reviews.length) * 10) / 10;
        } else {
          journal.rating = 0;
        }
      }
    });

    // 删除用户
    db.data.users.splice(userIndex, 1);
    await db.write();

    res.status(200).json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取所有评论
const getComments = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const db = getDB();

    let comments = [];

    // 1. 收集旧评论系统的评论 (journal.reviews)
    db.data.journals.forEach(journal => {
      if (journal.reviews) {
        journal.reviews.forEach((review, index) => {
          comments.push({
            id: `${journal.id}-${index}`,
            journalId: journal.id,
            journalTitle: journal.title,
            author: review.author,
            rating: review.rating,
            content: review.content,
            createdAt: review.createdAt
          });
        });
      }
    });

    // 2. 收集新评论系统的评论 (db.data.comments)
    if (db.data.comments && Array.isArray(db.data.comments)) {
      db.data.comments
        .filter(comment => !comment.isDeleted && !comment.parentId) // 只显示顶级评论，不显示回复
        .forEach(comment => {
          const journal = db.data.journals.find(j => j.id === comment.journalId);
          if (journal) {
            comments.push({
              id: comment.id,
              journalId: comment.journalId,
              journalTitle: journal.title,
              author: comment.userName,
              rating: comment.rating || 0,
              content: comment.content,
              createdAt: comment.createdAt
            });
          }
        });
    }

    // 按时间倒序排列
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      comments = comments.filter(comment =>
        comment.content.toLowerCase().includes(searchTerm) ||
        comment.author.toLowerCase().includes(searchTerm) ||
        comment.journalTitle.toLowerCase().includes(searchTerm)
      );
    }

    // 分页
    const skip = (page - 1) * limit;
    const total = comments.length;
    const paginatedComments = comments.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除评论
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // 判断是新评论还是旧评论
    // 新评论ID格式: "3-1770650396042-s796nm"
    // 旧评论ID格式: "journalId-reviewIndex" (只有两段，且都是数字)
    const idParts = id.split('-');

    // 如果ID有3段或以上，或者第二段不是纯数字，说明是新评论系统
    if (idParts.length >= 3 || (idParts.length === 2 && isNaN(idParts[1]))) {
      // 新评论系统
      const commentIndex = db.data.comments.findIndex(c => c.id === id);

      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '评论未找到'
        });
      }

      const comment = db.data.comments[commentIndex];

      // 标记为已删除而不是真正删除（保留回复关系）
      db.data.comments[commentIndex].isDeleted = true;

      // 如果有评分，需要重新计算期刊平均分
      if (comment.rating) {
        const journal = db.data.journals.find(j => j.id === comment.journalId);
        if (journal) {
          // 收集该期刊所有有效的评分
          const ratings = db.data.comments
            .filter(c => c.journalId === comment.journalId && !c.isDeleted && c.rating)
            .map(c => c.rating);

          // 加上旧评论系统的评分
          if (journal.reviews) {
            journal.reviews.forEach(r => ratings.push(r.rating));
          }

          if (ratings.length > 0) {
            const totalRating = ratings.reduce((sum, r) => sum + r, 0);
            journal.rating = Math.round((totalRating / ratings.length) * 10) / 10;
          } else {
            journal.rating = 0;
          }
        }
      }

    } else {
      // 旧评论系统 - id格式: journalId-reviewIndex
      const [journalId, reviewIndex] = id.split('-').map(Number);

      const journal = db.data.journals.find(j => j.id === journalId);
      if (!journal || !journal.reviews || !journal.reviews[reviewIndex]) {
        return res.status(404).json({
          success: false,
          message: '评论未找到'
        });
      }

      // 删除评论
      journal.reviews.splice(reviewIndex, 1);

      // 重新计算平均评分（包括新评论系统的评分）
      const ratings = [];

      // 旧评论系统的评分
      if (journal.reviews) {
        journal.reviews.forEach(r => ratings.push(r.rating));
      }

      // 新评论系统的评分
      db.data.comments
        .filter(c => c.journalId === journalId && !c.isDeleted && c.rating)
        .forEach(c => ratings.push(c.rating));

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + r, 0);
        journal.rating = Math.round((totalRating / ratings.length) * 10) / 10;
      } else {
        journal.rating = 0;
      }
    }

    await db.write();

    res.status(200).json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers, updateUser, deleteUser, getComments, deleteComment };
