const { Favorite, Journal, JournalLevel, JournalRatingCache, Comment } = require('../models');
const badgeService = require('../services/badgeService');
const { calculateJournalHotScore, calculateJournalAllTimeScore } = require('../utils/hotScore');
const { Op } = require('sequelize');

// 添加收藏
const addFavorite = async (req, res) => {
    try {
        const { journalId } = req.body;

        const journal = await Journal.findByPk(journalId);
        if (!journal) {
            return res.status(404).json({ message: '期刊不存在' });
        }

        const existing = await Favorite.findOne({
            where: { userId: req.user.id, journalId: journalId }
        });

        if (existing) {
            return res.status(400).json({ message: '已经收藏过该期刊' });
        }

        const newFavorite = await Favorite.create({
            userId: req.user.id,
            journalId: journalId
        });

        // Update journal hot ranking scores
        await updateJournalScoresOnFavorite(journalId);

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
            where: { userId: req.user.id, journalId: journalId }
        });

        if (!favorite) {
            return res.status(404).json({ message: '未收藏该期刊' });
        }

        await favorite.destroy();

        // Update journal hot ranking scores
        await updateJournalScoresOnFavorite(journalId);

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
            where: { userId: req.user.id, journalId: journalId }
        });

        res.json({ isFavorited: !!favorite });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({ message: '检查收藏状态失败' });
    }
};

// 批量检查收藏状态
const batchCheckFavorites = async (req, res) => {
    try {
        const { journalIds } = req.body;

        if (!Array.isArray(journalIds) || journalIds.length === 0) {
            return res.json({ favorites: {} });
        }

        const favorites = await Favorite.findAll({
            where: { userId: req.user.id, journalId: journalIds },
            attributes: ['journalId']
        });

        const favoriteSet = new Set(favorites.map(f => f.journalId));
        const result = {};
        journalIds.forEach(id => { result[id] = favoriteSet.has(id); });

        res.json({ favorites: result });
    } catch (error) {
        console.error('Error batch checking favorites:', error);
        res.status(500).json({ message: '批量检查收藏状态失败' });
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
            include: [{
                model: Journal,
                as: 'journal',
                include: [
                    { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                    { model: JournalRatingCache, as: 'ratingCache' }
                ]
            }]
        });

        const favoritesWithJournal = rows.map(f => {
            const data = f.toJSON();
            if (data.journal) {
                data.journal.levels = data.journal.levels ? data.journal.levels.map(l => l.levelName) : [];
            }
            return {
                id: data.id,
                journal: data.journal,
                createdAt: data.createdAt
            };
        });

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

// Helper: recalculate journal scores after favorite change
async function updateJournalScoresOnFavorite(journalId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);

  const [recentCommentCount, recentFavoriteCount, totalFavoriteCount, cache, journal] = await Promise.all([
    Comment.count({ where: { journalId, parentId: null, isDeleted: false, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    Favorite.count({ where: { journalId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    Favorite.count({ where: { journalId } }),
    JournalRatingCache.findByPk(journalId),
    Journal.findByPk(journalId, { attributes: ['impactFactor'] })
  ]);

  const rating = cache ? cache.rating : 0;
  const ratingCount = cache ? cache.ratingCount : 0;
  const impactFactor = journal ? journal.impactFactor : null;

  const hotScore = calculateJournalHotScore(recentCommentCount, recentFavoriteCount, rating);
  const allTimeScore = calculateJournalAllTimeScore(ratingCount, totalFavoriteCount, rating, impactFactor);

  await JournalRatingCache.upsert({
    journalId,
    hotScore,
    allTimeScore,
    favoriteCount: totalFavoriteCount
  });
}

module.exports = {
    addFavorite,
    removeFavorite,
    checkFavorite,
    batchCheckFavorites,
    getUserFavorites
};
