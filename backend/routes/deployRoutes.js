const express = require('express');
const router = express.Router();
const { superAdminProtect } = require('../middleware/superAdminAuth');
const {
  getDeployStatus,
  getDeployHistory,
  getHealthStatus
} = require('../controllers/deployController');

// 所有路由需要超级管理员权限
router.use(superAdminProtect);

// 获取当前部署状态
router.get('/status', getDeployStatus);

// 获取部署历史
router.get('/history', getDeployHistory);

// 获取实时健康状态
router.get('/health', getHealthStatus);

module.exports = router;
