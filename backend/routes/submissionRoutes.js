const express = require('express');
const router = express.Router();
const {
    createManuscript,
    getUserManuscripts,
    getManuscriptById,
    updateManuscript,
    deleteManuscript,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    addStatusHistory,
    deleteStatusHistory
} = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

// 所有路由都需要登录
router.use(protect);

// ==================== 稿件 ====================
// 创建稿件（含可选的第一次投稿）
router.post('/manuscripts', createManuscript);

// 获取当前用户的所有稿件
router.get('/manuscripts', getUserManuscripts);

// 获取指定稿件详情
router.get('/manuscripts/:id', getManuscriptById);

// 更新稿件
router.put('/manuscripts/:id', updateManuscript);

// 删除稿件
router.delete('/manuscripts/:id', deleteManuscript);

// ==================== 投稿 ====================
// 为稿件添加一次新投稿（转投/多投）
router.post('/manuscripts/:manuscriptId/submissions', addSubmission);

// 更新投稿
router.put('/submissions/:submissionId', updateSubmission);

// 删除投稿
router.delete('/submissions/:submissionId', deleteSubmission);

// ==================== 状态历史 ====================
// 追加时间轴事件
router.post('/submissions/:submissionId/status', addStatusHistory);

// 删除状态历史
router.delete('/status/:historyId', deleteStatusHistory);

module.exports = router;
