const express = require('express');
const { getJournals, getJournalById, addJournalReview } = require('../controllers/journalControllerLowdb');

const router = express.Router();

// 公共路由
router.get('/', getJournals);
router.get('/:id', getJournalById);
router.post('/:id/reviews', addJournalReview);

module.exports = router;