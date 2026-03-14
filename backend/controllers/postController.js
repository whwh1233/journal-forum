const { Post, User, Journal, PostLike, PostFavorite, PostFollow, PostReport, Tag, PostTagMap, PostCategory, SystemConfig } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');
const { updatePostScores, calculatePostAllTimeScore } = require('../utils/hotScore');

// Helper: filter pending tags — only show approved tags or pending tags created by the current user
const filterPendingTags = (post, userId) => {
    if (post.tags_assoc) {
        post.tags_assoc = post.tags_assoc.filter(
            t => t.status === 'approved' || (userId && t.createdBy === userId)
        );
    }
    return post;
};

// Common includes for Tag and PostCategory
const tagInclude = {
    model: Tag,
    as: 'tags_assoc',
    attributes: ['id', 'name', 'isOfficial', 'status', 'createdBy'],
    through: { attributes: [] },
    required: false
};

const postCategoryInclude = {
    model: PostCategory,
    as: 'postCategory',
    attributes: ['id', 'name', 'slug'],
    required: false
};

// 获取帖子列表（带筛选、排序、分页）
exports.getPosts = async (req, res) => {
    try {
        const {
            category,
            tag,
            journalId,
            userId,
            sortBy = 'hot',
            page = 1,
            limit = 20,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { isDeleted: false, status: 'published' };

        // 筛选条件
        if (category) {
            if (isNaN(category)) {
                const cat = await PostCategory.findOne({ where: { slug: category } });
                if (cat) where.categoryId = cat.id;
            } else {
                where.categoryId = parseInt(category);
            }
        }
        if (journalId) where.journalId = journalId;
        if (userId) where.userId = userId;

        // Tag filter: use PostTagMap lookup instead of JSON LIKE
        if (tag) {
            const tagRecord = await Tag.findOne({ where: { normalizedName: tag.toLowerCase() } });
            if (tagRecord) {
                const tagPostIds = await PostTagMap.findAll({
                    where: { tagId: tagRecord.id },
                    attributes: ['postId']
                });
                where.id = { ...(where.id || {}), [Op.in]: tagPostIds.map(t => t.postId) };
            } else {
                return res.json({ posts: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
            }
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        // 排序逻辑
        let order;
        switch (sortBy) {
            case 'latest':
                order = [['isPinned', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'likes':
                order = [['isPinned', 'DESC'], ['likeCount', 'DESC']];
                break;
            case 'comments':
                order = [['isPinned', 'DESC'], ['commentCount', 'DESC']];
                break;
            case 'views':
                order = [['isPinned', 'DESC'], ['viewCount', 'DESC']];
                break;
            case 'allTime':
                order = [['isPinned', 'DESC'], ['allTimeScore', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'hot':
            default:
                order = [['isPinned', 'DESC'], ['hotScore', 'DESC'], ['createdAt', 'DESC']];
        }

        const { count, rows: posts } = await Post.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['journalId', 'name'],
                    required: false
                },
                tagInclude,
                postCategoryInclude
            ],
            order,
            limit: parseInt(limit),
            offset,
            distinct: true
        });

        // 如果用户已登录，附加用户互动状态
        let postsWithUserStatus;
        if (req.user) {
            const postIds = posts.map(p => p.id);
            const [likes, favorites, follows] = await Promise.all([
                PostLike.findAll({ where: { postId: postIds, userId: req.user.id } }),
                PostFavorite.findAll({ where: { postId: postIds, userId: req.user.id } }),
                PostFollow.findAll({ where: { postId: postIds, userId: req.user.id } })
            ]);

            const likedIds = new Set(likes.map(l => l.postId));
            const favoritedIds = new Set(favorites.map(f => f.postId));
            const followedIds = new Set(follows.map(f => f.postId));

            postsWithUserStatus = posts.map(post => {
                const postJson = {
                    ...post.toJSON(),
                    userLiked: likedIds.has(post.id),
                    userFavorited: favoritedIds.has(post.id),
                    userFollowed: followedIds.has(post.id)
                };
                return filterPendingTags(postJson, req.user.id);
            });
        } else {
            postsWithUserStatus = posts.map(post => {
                const postJson = post.toJSON();
                return filterPendingTags(postJson, null);
            });
        }

        res.json({
            posts: postsWithUserStatus,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({ error: '获取帖子列表失败' });
    }
};

// 获取单个帖子详情
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar', 'bio']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['journalId', 'name', 'issn'],
                    required: false
                },
                tagInclude,
                postCategoryInclude
            ]
        });

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        if (post.isDeleted) {
            return res.status(404).json({ error: '该帖子已被删除' });
        }

        // 附加用户互动状态
        let postData = post.toJSON();
        if (req.user) {
            const [like, favorite, follow] = await Promise.all([
                PostLike.findOne({ where: { postId: id, userId: req.user.id } }),
                PostFavorite.findOne({ where: { postId: id, userId: req.user.id } }),
                PostFollow.findOne({ where: { postId: id, userId: req.user.id } })
            ]);

            postData.userLiked = !!like;
            postData.userFavorited = !!favorite;
            postData.userFollowed = !!follow;
            filterPendingTags(postData, req.user.id);
        } else {
            filterPendingTags(postData, null);
        }

        res.json(postData);
    } catch (error) {
        console.error('获取帖子详情失败:', error);
        res.status(500).json({ error: '获取帖子详情失败' });
    }
};

// 创建帖子
exports.createPost = async (req, res) => {
    try {
        const { title, content, categoryId, tagIds, newTags, journalId, status } = req.body;

        // 验证必填字段
        if (!title || !content) {
            return res.status(400).json({ error: '标题和内容为必填项' });
        }

        // Validate categoryId
        if (categoryId) {
            const cat = await PostCategory.findByPk(categoryId);
            if (!cat) {
                return res.status(400).json({ error: '分类不存在' });
            }
            if (!cat.isActive) {
                return res.status(400).json({ error: '该分类已停用' });
            }
        }

        // Process newTags: normalize, findOrCreate
        const createdNewTagIds = [];
        if (newTags && Array.isArray(newTags) && newTags.length > 0) {
            for (const tagName of newTags) {
                const trimmed = tagName.trim();
                if (!trimmed) continue;
                const normalizedName = trimmed.toLowerCase();
                const [tagRecord] = await Tag.findOrCreate({
                    where: { normalizedName },
                    defaults: {
                        name: trimmed,
                        normalizedName,
                        status: 'pending',
                        isOfficial: false,
                        createdBy: req.user.id
                    }
                });
                createdNewTagIds.push(tagRecord.id);
            }
        }

        // Merge tagIds + new tag ids, deduplicate
        const existingTagIds = Array.isArray(tagIds) ? tagIds.map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        const allTagIds = [...new Set([...existingTagIds, ...createdNewTagIds])];

        // Check total tags <= maxTagsPerPost
        const maxTagsPerPost = parseInt(await SystemConfig.getValue('maxTagsPerPost', '5'));
        if (allTagIds.length > maxTagsPerPost) {
            return res.status(400).json({ error: `每篇帖子最多 ${maxTagsPerPost} 个标签` });
        }

        // Validate that all existing tagIds actually exist
        if (existingTagIds.length > 0) {
            const validTags = await Tag.findAll({ where: { id: existingTagIds } });
            if (validTags.length !== existingTagIds.length) {
                return res.status(400).json({ error: '部分标签不存在' });
            }
        }

        // 获取用户信息
        const user = await User.findByPk(req.user.id);

        const post = await Post.create({
            userId: req.user.id,
            title,
            content,
            category: null,
            categoryId: categoryId || null,
            tags: [],
            journalId: journalId || null,
            status: status || 'published'
        });

        // BulkCreate PostTagMap entries
        if (allTagIds.length > 0) {
            await PostTagMap.bulkCreate(
                allTagIds.map(tagId => ({ postId: post.id, tagId }))
            );

            // Increment Tag.postCount for all associated tags
            await Tag.increment('postCount', { where: { id: allTagIds } });
        }

        // Increment PostCategory.postCount if published and has category
        if (categoryId && (status || 'published') === 'published') {
            await PostCategory.increment('postCount', { where: { id: categoryId } });
        }

        // 返回完整帖子信息
        const fullPost = await Post.findByPk(post.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['journalId', 'name'],
                    required: false
                },
                tagInclude,
                postCategoryInclude
            ]
        });

        // Notify: follow_new_content (to all followers of post author)
        try {
            const { Follow } = require('../models');
            const followers = await Follow.findAll({
                where: { followingId: req.user.id },
                attributes: ['followerId']
            });
            const followerIds = followers.map(f => f.followerId);
            if (followerIds.length > 0) {
                await notificationService.createBulk(followerIds, {
                    senderId: req.user.id,
                    type: 'follow_new_content',
                    entityType: 'post',
                    entityId: fullPost.id,
                    content: {
                        title: `你关注的 ${req.user.name} 发布了新内容`,
                        body: title ? title.substring(0, 100) : '',
                        contentTitle: title || '',
                        contentType: 'post'
                    }
                });
            }
        } catch (err) {
            console.error('Notification (follow_new_content) failed:', err.message);
        }

        res.status(201).json(fullPost);
    } catch (error) {
        console.error('创建帖子失败:', error);
        res.status(500).json({ error: '创建帖子失败' });
    }
};

// 更新帖子
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, categoryId, tagIds, newTags, journalId } = req.body;

        const post = await Post.findByPk(id, {
            include: [tagInclude]
        });

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 权限检查：只有作者本人可以编辑
        if (post.userId !== req.user.id) {
            return res.status(403).json({ error: '无权编辑此帖子' });
        }

        // Handle categoryId change
        if (categoryId !== undefined && categoryId !== post.categoryId) {
            if (categoryId) {
                const cat = await PostCategory.findByPk(categoryId);
                if (!cat) {
                    return res.status(400).json({ error: '分类不存在' });
                }
                if (!cat.isActive) {
                    return res.status(400).json({ error: '该分类已停用' });
                }
            }
            // Decrement old category postCount
            if (post.categoryId && post.status === 'published') {
                await PostCategory.decrement('postCount', { where: { id: post.categoryId } });
            }
            // Increment new category postCount
            if (categoryId && post.status === 'published') {
                await PostCategory.increment('postCount', { where: { id: categoryId } });
            }
        }

        // Handle tags change
        if (tagIds !== undefined || newTags !== undefined) {
            // Process newTags
            const createdNewTagIds = [];
            if (newTags && Array.isArray(newTags) && newTags.length > 0) {
                for (const tagName of newTags) {
                    const trimmed = tagName.trim();
                    if (!trimmed) continue;
                    const normalizedName = trimmed.toLowerCase();
                    const [tagRecord] = await Tag.findOrCreate({
                        where: { normalizedName },
                        defaults: {
                            name: trimmed,
                            normalizedName,
                            status: 'pending',
                            isOfficial: false,
                            createdBy: req.user.id
                        }
                    });
                    createdNewTagIds.push(tagRecord.id);
                }
            }

            const existingTagIds = Array.isArray(tagIds) ? tagIds.map(tid => parseInt(tid)).filter(tid => !isNaN(tid)) : [];
            const newAllTagIds = [...new Set([...existingTagIds, ...createdNewTagIds])];

            // Check total tags <= maxTagsPerPost
            const maxTagsPerPost = parseInt(await SystemConfig.getValue('maxTagsPerPost', '5'));
            if (newAllTagIds.length > maxTagsPerPost) {
                return res.status(400).json({ error: `每篇帖子最多 ${maxTagsPerPost} 个标签` });
            }

            // Compute diff: old tag ids vs new tag ids
            const oldTagIds = post.tags_assoc ? post.tags_assoc.map(t => t.id) : [];
            const removedTagIds = oldTagIds.filter(tid => !newAllTagIds.includes(tid));
            const addedTagIds = newAllTagIds.filter(tid => !oldTagIds.includes(tid));

            // Decrement removed tags postCount
            if (removedTagIds.length > 0) {
                await Tag.decrement('postCount', { where: { id: removedTagIds } });
            }
            // Increment added tags postCount
            if (addedTagIds.length > 0) {
                await Tag.increment('postCount', { where: { id: addedTagIds } });
            }

            // Clear old PostTagMap, insert new
            await PostTagMap.destroy({ where: { postId: post.id } });
            if (newAllTagIds.length > 0) {
                await PostTagMap.bulkCreate(
                    newAllTagIds.map(tagId => ({ postId: post.id, tagId }))
                );
            }
        }

        await post.update({
            title: title || post.title,
            content: content || post.content,
            categoryId: categoryId !== undefined ? (categoryId || null) : post.categoryId,
            journalId: journalId !== undefined ? journalId : post.journalId
        });

        const updatedPost = await Post.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                { model: Journal, as: 'journal', attributes: ['journalId', 'name'], required: false },
                tagInclude,
                postCategoryInclude
            ]
        });

        res.json(updatedPost);
    } catch (error) {
        console.error('更新帖子失败:', error);
        res.status(500).json({ error: '更新帖子失败' });
    }
};

// 删除帖子（软删除）
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 权限检查：作者或管理员可删除
        if (post.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权删除此帖子' });
        }

        await post.update({ isDeleted: true });

        // Decrement PostCategory.postCount
        if (post.categoryId && post.status === 'published') {
            await PostCategory.decrement('postCount', { where: { id: post.categoryId } });
        }

        // Decrement Tag.postCount for all associated tags
        const tagMaps = await PostTagMap.findAll({ where: { postId: post.id }, attributes: ['tagId'] });
        const tagIds = tagMaps.map(t => t.tagId);
        if (tagIds.length > 0) {
            await Tag.decrement('postCount', { where: { id: tagIds } });
        }

        res.json({ message: '帖子已删除' });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).json({ error: '删除帖子失败' });
    }
};

// 增加浏览计数
exports.incrementViewCount = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        await post.increment('viewCount');
        await post.reload();
        await post.update({ allTimeScore: calculatePostAllTimeScore(post) });

        res.json({ viewCount: post.viewCount });
    } catch (error) {
        console.error('更新浏览计数失败:', error);
        res.status(500).json({ error: '更新浏览计数失败' });
    }
};

// 点赞/取消点赞 (Toggle)
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingLike = await PostLike.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingLike) {
            // 取消点赞
            await existingLike.destroy();
            await post.decrement('likeCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ liked: false, likeCount: post.likeCount });
        } else {
            // 点赞
            await PostLike.create({ postId: id, userId: req.user.id });
            await post.increment('likeCount');
            await post.reload();
            await updatePostScores(post);

            // Notify: like (to post author)
            try {
                await notificationService.create({
                    recipientId: post.userId,
                    senderId: req.user.id,
                    type: 'like',
                    entityType: 'post',
                    entityId: id,
                    content: {
                        title: `${req.user.name} 赞了你的帖子`,
                        body: post.title || '',
                        postTitle: post.title || ''
                    }
                });
            } catch (err) {
                console.error('Notification (like) failed:', err.message);
            }

            res.json({ liked: true, likeCount: post.likeCount });
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({ error: '点赞操作失败' });
    }
};

// 收藏/取消收藏 (Toggle)
exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingFavorite = await PostFavorite.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingFavorite) {
            await existingFavorite.destroy();
            await post.decrement('favoriteCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ favorited: false, favoriteCount: post.favoriteCount });
        } else {
            await PostFavorite.create({ postId: id, userId: req.user.id });
            await post.increment('favoriteCount');
            await post.reload();
            await updatePostScores(post);
            res.json({ favorited: true, favoriteCount: post.favoriteCount });
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        res.status(500).json({ error: '收藏操作失败' });
    }
};

// 关注/取消关注 (Toggle)
exports.toggleFollow = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        const existingFollow = await PostFollow.findOne({
            where: { postId: id, userId: req.user.id }
        });

        if (existingFollow) {
            await existingFollow.destroy();
            await post.decrement('followCount');
            res.json({ followed: false, followCount: post.followCount - 1 });
        } else {
            await PostFollow.create({ postId: id, userId: req.user.id });
            await post.increment('followCount');
            res.json({ followed: true, followCount: post.followCount + 1 });
        }
    } catch (error) {
        console.error('关注操作失败:', error);
        res.status(500).json({ error: '关注操作失败' });
    }
};

// 举报帖子
exports.reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: '请提供举报原因' });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        await PostReport.create({
            postId: id,
            reporterId: req.user.id,
            reason
        });

        res.json({ message: '举报已提交，我们会尽快处理' });
    } catch (error) {
        console.error('举报失败:', error);
        res.status(500).json({ error: '举报失败' });
    }
};

// 获取我的帖子
exports.getMyPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await Post.findAndCountAll({
            where: { userId: req.user.id, isDeleted: false },
            include: [
                { model: Journal, as: 'journal', attributes: ['journalId', 'name'], required: false },
                tagInclude,
                postCategoryInclude
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取我的帖子失败:', error);
        res.status(500).json({ error: '获取我的帖子失败' });
    }
};

// 获取我收藏的帖子
exports.getMyFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: favorites } = await PostFavorite.findAndCountAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Post,
                    where: { isDeleted: false },
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                        { model: Journal, as: 'journal', attributes: ['journalId', 'name'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const posts = favorites.map(f => ({ ...f.Post.toJSON(), userFavorited: true }));

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取收藏列表失败:', error);
        res.status(500).json({ error: '获取收藏列表失败' });
    }
};

// 获取我关注的帖子
exports.getMyFollows = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: follows } = await PostFollow.findAndCountAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Post,
                    where: { isDeleted: false },
                    include: [
                        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                        { model: Journal, as: 'journal', attributes: ['journalId', 'name'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const posts = follows.map(f => ({ ...f.Post.toJSON(), userFollowed: true }));

        res.json({
            posts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('获取关注列表失败:', error);
        res.status(500).json({ error: '获取关注列表失败' });
    }
};
