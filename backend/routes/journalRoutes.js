const express = require('express');
const { getJournals, getJournalById, addJournalReview, searchJournals, getCategories } = require('../controllers/journalController');

const router = express.Router();

// 公共路由
router.get('/', getJournals);
router.get('/search', searchJournals);      // 期刊搜索（用于投稿追踪）
router.get('/categories', getCategories);   // 期刊分类列表
router.get('/:id', getJournalById);
router.post('/:id/reviews', addJournalReview);

module.exports = router;