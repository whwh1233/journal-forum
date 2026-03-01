const express = require('express');
const router = express.Router();
const {
  getCommentsByJournalId,
  createComment,
  updateComment,
  deleteComment,
  getRatingSummary
} = require('../controllers/commentControllerLowdb');
const { protect } = require('../middleware/auth');

// 获取期刊的所有评论
router.get('/journal/:journalId', getCommentsByJournalId);

// 获取期刊多维评分汇总
router.get('/journal/:journalId/ratings', getRatingSummary);

// 创建评论或回复（需要登录）
router.post('/', protect, createComment);

// 更新评论（需要登录）
router.put('/:commentId', protect, updateComment);

// 删除评论（需要登录）
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
