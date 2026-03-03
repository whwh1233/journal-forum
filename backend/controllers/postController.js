const { Post, User, Journal, PostLike, PostFavorite, PostFollow } = require('../models');
const { Op } = require('sequelize');

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
        if (category) where.category = category;
        if (journalId) where.journalId = journalId;
        if (userId) where.userId = userId;
        if (tag) where.tags = { [Op.contains]: [tag] };
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
                order = [['createdAt', 'DESC']];
                break;
            case 'likes':
                order = [['likeCount', 'DESC']];
                break;
            case 'comments':
                order = [['commentCount', 'DESC']];
                break;
            case 'views':
                order = [['viewCount', 'DESC']];
                break;
            case 'hot':
            default:
                order = [['hotScore', 'DESC'], ['createdAt', 'DESC']];
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
                    attributes: ['id', 'title'],
                    required: false
                }
            ],
            order,
            limit: parseInt(limit),
            offset,
            distinct: true
        });

        // 如果用户已登录，附加用户互动状态
        let postsWithUserStatus = posts;
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

            postsWithUserStatus = posts.map(post => ({
                ...post.toJSON(),
                userLiked: likedIds.has(post.id),
                userFavorited: favoritedIds.has(post.id),
                userFollowed: followedIds.has(post.id)
            }));
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
                    attributes: ['id', 'title', 'issn'],
                    required: false
                }
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
        const { title, content, category, tags, journalId } = req.body;

        // 验证必填字段
        if (!title || !content || !category) {
            return res.status(400).json({ error: '标题、内容和分类为必填项' });
        }

        // 获取用户信息
        const user = await User.findByPk(req.user.id);

        const post = await Post.create({
            userId: req.user.id,
            title,
            content,
            category,
            tags: tags || [],
            journalId: journalId || null
        });

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
                    attributes: ['id', 'title'],
                    required: false
                }
            ]
        });

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
        const { title, content, category, tags, journalId } = req.body;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: '帖子不存在' });
        }

        // 权限检查：只有作者本人可以编辑
        if (post.userId !== req.user.id) {
            return res.status(403).json({ error: '无权编辑此帖子' });
        }

        await post.update({
            title: title || post.title,
            content: content || post.content,
            category: category || post.category,
            tags: tags !== undefined ? tags : post.tags,
            journalId: journalId !== undefined ? journalId : post.journalId
        });

        const updatedPost = await Post.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
                { model: Journal, as: 'journal', attributes: ['id', 'title'], required: false }
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

        res.json({ viewCount: post.viewCount + 1 });
    } catch (error) {
        console.error('更新浏览计数失败:', error);
        res.status(500).json({ error: '更新浏览计数失败' });
    }
};
