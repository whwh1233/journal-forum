const { Favorite, Journal } = require('../models');
const badgeService = require('../services/badgeService');

// 添加收藏
const addFavorite = async (req, res) => {
    try {
        const { journalId } = req.body;

        const journal = await Journal.findByPk(parseInt(journalId));
        if (!journal) {
            return res.status(404).json({ message: '期刊不存在' });
        }

        const existing = await Favorite.findOne({
            where: { userId: req.user.id, journalId: parseInt(journalId) }
        });

        if (existing) {
            return res.status(400).json({ message: '已经收藏过该期刊' });
        }

        const newFavorite = await Favorite.create({
            userId: req.user.id,
            journalId: parseInt(journalId)
        });

        // 检查收藏徽章
        let newBadges = [];
        try {
            newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'favoriteCount');
        } catch (err) {
            console.error('Badge check failed:', err);
        }

        const result = newFavorite.toJSON();
        result.newBadges = newBadges.length > 0 ? newBadges : undefined;

        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: '收藏失败' });
    }
};

// 取消收藏
const removeFavorite = async (req, res) => {
    try {
        const { journalId } = req.params;

        const favorite = await Favorite.findOne({
            where: { userId: req.user.id, journalId: parseInt(journalId) }
        });

        if (!favorite) {
            return res.status(404).json({ message: '未收藏该期刊' });
        }

        await favorite.destroy();
        res.json({ message: '取消收藏成功' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: '取消收藏失败' });
    }
};

// 检查是否已收藏
const checkFavorite = async (req, res) => {
    try {
        const { journalId } = req.params;

        const favorite = await Favorite.findOne({
            where: { userId: req.user.id, journalId: parseInt(journalId) }
        });

        res.json({ isFavorited: !!favorite });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({ message: '检查收藏状态失败' });
    }
};

// 获取用户的收藏列表（分页）
const getUserFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.params.userId || req.user.id;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Favorite.findAndCountAll({
            where: { userId },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset,
            include: [{ model: Journal, as: 'journal' }]
        });

        const favoritesWithJournal = rows.map(f => ({
            id: f.id,
            journal: f.journal,
            createdAt: f.createdAt
        }));

        res.json({
            favorites: favoritesWithJournal,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting user favorites:', error);
        res.status(500).json({ message: '获取收藏列表失败' });
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    checkFavorite,
    getUserFavorites
};
