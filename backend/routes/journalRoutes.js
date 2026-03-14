const express = require('express');
const { getJournals, getJournalById, searchJournals, getLevels, getCategories } = require('../controllers/journalController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 公共路由（optionalAuth: 登录用户额外获得收藏状态）
router.get('/', optionalAuth, getJournals);
router.get('/search', searchJournals);      // 期刊搜索（用于投稿追踪）
router.get('/levels', getLevels);           // 期刊等级列表
router.get('/categories', getCategories);   // 期刊分类列表（树形）
router.get('/:id', optionalAuth, getJournalById);

module.exports = router;
