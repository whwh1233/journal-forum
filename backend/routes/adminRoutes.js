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
const {
  adminGetAnnouncements,
  adminGetAnnouncementById,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminPublishAnnouncement,
  adminArchiveAnnouncement,
  adminDeleteAnnouncement
} = require('../controllers/announcementController');
const {
  adminGetCategories, adminCreateCategory, adminUpdateCategory,
  adminToggleCategory, adminReorderCategories, adminMigrateCategory
} = require('../controllers/postCategoryController');
const {
  adminGetTags, adminCreateTag, adminUpdateTag, adminDeleteTag,
  adminApproveTag, adminRejectTag, adminBatchApprove, adminBatchReject, adminMergeTags
} = require('../controllers/tagController');

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

// 公告管理
router.get('/announcements', adminGetAnnouncements);
router.post('/announcements', adminCreateAnnouncement);
router.get('/announcements/:id', adminGetAnnouncementById);
router.put('/announcements/:id', adminUpdateAnnouncement);
router.put('/announcements/:id/publish', adminPublishAnnouncement);
router.put('/announcements/:id/archive', adminArchiveAnnouncement);
router.delete('/announcements/:id', adminDeleteAnnouncement);

// 标签管理
router.get('/tags', adminGetTags);
router.post('/tags', adminCreateTag);
router.post('/tags/batch-approve', adminBatchApprove);
router.post('/tags/batch-reject', adminBatchReject);
router.post('/tags/merge', adminMergeTags);
router.put('/tags/:id', adminUpdateTag);
router.delete('/tags/:id', adminDeleteTag);
router.put('/tags/:id/approve', adminApproveTag);
router.put('/tags/:id/reject', adminRejectTag);

// 帖子分类管理
router.get('/post-categories', adminGetCategories);
router.post('/post-categories', adminCreateCategory);
router.put('/post-categories/reorder', adminReorderCategories);
router.put('/post-categories/:id', adminUpdateCategory);
router.put('/post-categories/:id/toggle', adminToggleCategory);
router.post('/post-categories/:id/migrate', adminMigrateCategory);

module.exports = router;
