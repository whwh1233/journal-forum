const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getComments,
  deleteComment,
  getPostReports,
  updatePostReportStatus,
  batchProcessReports
} = require('../controllers/adminController');
const {
  createJournal,
  updateJournal,
  deleteJournal
} = require('../controllers/journalController');

// 所有路由都需要管理员权限
router.use(adminProtect);

// 统计数据
router.get('/stats', getStats);

// 用户管理
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// 期刊管理 (CRUD)
router.post('/journals', createJournal);
router.put('/journals/:id', updateJournal);
router.delete('/journals/:id', deleteJournal);

// 评论管理
router.get('/comments', getComments);
router.delete('/comments/:id', deleteComment);

// 帖子举报管理
router.get('/post-reports', getPostReports);
router.put('/post-reports/:id', updatePostReportStatus);
router.post('/post-reports/batch', batchProcessReports);

module.exports = router;
