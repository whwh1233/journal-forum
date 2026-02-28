const { getDB } = require('../config/databaseLowdb');
const badgeService = require('../services/badgeService');

// 添加收藏
const addFavorite = async (req, res) => {
  try {
    const { journalId } = req.body;
    const db = getDB();

    // 验证期刊是否存在
    const journal = db.data.journals.find(j => j.id === parseInt(journalId));
    if (!journal) {
      return res.status(404).json({ message: '期刊不存在' });
    }

    // 检查是否已收藏
    const existing = db.data.favorites.find(
      f => f.userId === req.user.id && f.journalId === parseInt(journalId)
    );

    if (existing) {
      return res.status(400).json({ message: '已经收藏过该期刊' });
    }

    // 创建收藏记录
    const newFavorite = {
      id: db.data.favorites.length > 0
        ? Math.max(...db.data.favorites.map(f => f.id)) + 1
        : 1,
      userId: req.user.id,
      journalId: parseInt(journalId),
      createdAt: new Date().toISOString()
    };

    db.data.favorites.push(newFavorite);
    await db.write();

    // 检查收藏徽章
    let newBadges = [];
    try {
      newBadges = await badgeService.checkAndGrantBadges(req.user.id, 'favoriteCount');
    } catch (err) {
      console.error('Badge check failed:', err);
    }

    res.status(201).json({
      ...newFavorite,
      newBadges: newBadges.length > 0 ? newBadges : undefined
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: '收藏失败' });
  }
};

// 取消收藏
const removeFavorite = async (req, res) => {
  try {
    const { journalId } = req.params;
    const db = getDB();

    const favoriteIndex = db.data.favorites.findIndex(
      f => f.userId === req.user.id && f.journalId === parseInt(journalId)
    );

    if (favoriteIndex === -1) {
      return res.status(404).json({ message: '未收藏该期刊' });
    }

    db.data.favorites.splice(favoriteIndex, 1);
    await db.write();

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
    const db = getDB();

    const isFavorited = db.data.favorites.some(
      f => f.userId === req.user.id && f.journalId === parseInt(journalId)
    );

    res.json({ isFavorited });
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
    const db = getDB();

    const userFavorites = db.data.favorites
      .filter(f => f.userId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFavorites = userFavorites.slice(startIndex, endIndex);

    const favoritesWithJournal = paginatedFavorites.map(favorite => {
      const journal = db.data.journals.find(j => j.id === favorite.journalId);
      return {
        id: favorite.id,
        journal,
        createdAt: favorite.createdAt
      };
    });

    res.json({
      favorites: favoritesWithJournal,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userFavorites.length / parseInt(limit)),
        totalItems: userFavorites.length,
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
