const { PostComment, Post, User, PostCommentLike } = require('../models');
const notificationService = require('../services/notificationService');

// 获取帖子的所有评论
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const comments = await PostComment.findAll({
            where: { postId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: PostComment,
                    as: 'replies',
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'avatar']
                        },
                        {
                            model: PostComment,
                            as: 'replies',
                            include: [
                                {
                                    model: User,
                                    attributes: ['id', 'name', 'avatar']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 只返回顶层评论（parentId 为 null）
        const topLevelComments = comments.filter(c => c.parentId === null);

        // 如果用户已登录，附加点赞状态
        let commentsWithLikeStatus = topLevelComments;
        if (req.user) {
            const allCommentIds = [];
            const collectIds = (comments) => {
                comments.forEach(c => {
                    allCommentIds.push(c.id);
                    if (c.replies) collectIds(c.replies);
                });
            };
            collectIds(topLevelComments);

            const likes = await PostCommentLike.findAll({
                where: { commentId: allCommentIds, userId: req.user.id }
            });
            const likedIds = new Set(likes.map(l => l.commentId));

            const attachLikeStatus = (comments) => {
                return comments.map(c => {
                    const commentData = c.toJSON();
                    commentData.userLiked = likedIds.has(c.id);
                    if (commentData.replies) {
                        commentData.replies = attachLikeStatus(commentData.replies);
                    }
                    return commentData;
                });
            };

            commentsWithLikeStatus = attachLikeStatus(topLevelComments);
        }

        res.json(commentsWithLikeStatus);
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ error: '获取评论失败' });
    }
};

// 发表评论
exports.createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;

        if (!content) {
            return res.status(400).json({ error: '评论内容不能为空' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 检查嵌套层级限制（最多 3 层）
        if (parentId) {
            const parentComment = await PostComment.findByPk(parentId);
            if (!parentComment) {
                return res.status(404).json({ error: '父评论不存在' });
            }

            // 检查父评论的层级
            let depth = 1;
            let current = parentComment;
            while (current.parentId) {
                depth++;
                current = await PostComment.findByPk(current.parentId);
                if (depth >= 3) {
                    return res.status(400).json({ error: '评论嵌套层级不能超过3层' });
                }
            }
        }

        const user = await User.findByPk(req.user.id);

        const comment = await PostComment.create({
            postId,
            userId: req.user.id,
            userName: user.name,
            parentId: parentId || null,
            content
        });

        // 增加帖子评论计数
        await post.increment('commentCount');

        // Notify: post_comment (to post author)
        try {
            await notificationService.create({
                recipientId: post.userId,
                senderId: req.user.id,
                type: 'post_comment',
                entityType: 'post',
                entityId: postId,
                content: {
                    title: `${user.name} 评论了你的帖子`,
                    body: content.substring(0, 100),
                    commentContent: content.substring(0, 200),
                    postTitle: post.title || ''
                }
            });
        } catch (err) {
            console.error('Notification (post_comment) failed:', err.message);
        }

        // Notify: post_comment_reply (to parent comment author)
        if (parentId) {
            try {
                const parentComment = await PostComment.findByPk(parentId);
                if (parentComment) {
                    await notificationService.create({
                        recipientId: parentComment.userId,
                        senderId: req.user.id,
                        type: 'post_comment_reply',
                        entityType: 'post_comment',
                        entityId: comment.id,
                        content: {
                            title: `${user.name} 回复了你的评论`,
                            body: content.substring(0, 100),
                            commentContent: content.substring(0, 200),
                            postTitle: post.title || ''
                        }
                    });
                }
            } catch (err) {
                console.error('Notification (post_comment_reply) failed:', err.message);
            }
        }

        // 返回完整评论信息
        const fullComment = await PostComment.findByPk(comment.id, {
            include: [
                { model: User, attributes: ['id', 'name', 'avatar'] }
            ]
        });

        res.status(201).json(fullComment);
    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({ error: '发表评论失败' });
    }
};

// 删除评论（软删除）
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        // 权限检查：作者或管理员可删除
        if (comment.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权删除此评论' });
        }

        await comment.update({ isDeleted: true, content: '[该评论已被删除]' });

        res.json({ message: '评论已删除' });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({ error: '删除评论失败' });
    }
};

// 点赞/取消点赞评论
exports.toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await PostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: '评论不存在' });
        }

        const existingLike = await PostCommentLike.findOne({
            where: { commentId, userId: req.user.id }
        });

        if (existingLike) {
            await existingLike.destroy();
            await comment.decrement('likeCount');
            res.json({ liked: false, likeCount: comment.likeCount - 1 });
        } else {
            await PostCommentLike.create({ commentId, userId: req.user.id });
            await comment.increment('likeCount');
            res.json({ liked: true, likeCount: comment.likeCount + 1 });
        }
    } catch (error) {
        console.error('评论点赞失败:', error);
        res.status(500).json({ error: '评论点赞失败' });
    }
};
