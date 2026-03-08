const express = require('express');
const { getJournals, getJournalById, searchJournals, getLevels, getCategories } = require('../controllers/journalController');

const router = express.Router();

// 公共路由
router.get('/', getJournals);
router.get('/search', searchJournals);      // 期刊搜索（用于投稿追踪）
router.get('/levels', getLevels);           // 期刊等级列表
router.get('/categories', getCategories);   // 期刊分类列表（树形）
router.get('/:id', getJournalById);

module.exports = router;
