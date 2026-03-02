const express = require('express');
const router = express.Router();
const { superAdminProtect } = require('../middleware/superAdminAuth');
const {
  getTables,
  getTableStructure,
  getTableData,
  updateRow,
  deleteRow,
  getAuditLogs
} = require('../controllers/databaseController');

// 所有路由需要超级管理员权限
router.use(superAdminProtect);

// 获取所有表列表
router.get('/tables', getTables);

// 获取表结构
router.get('/tables/:tableName/structure', getTableStructure);

// 获取表数据（支持分页、搜索、排序）
router.get('/tables/:tableName/data', getTableData);

// 更新行数据
router.put('/tables/:tableName/rows/:rowId', updateRow);

// 删除行
router.delete('/tables/:tableName/rows/:rowId', deleteRow);

// 获取审计日志
router.get('/audit-logs', getAuditLogs);

module.exports = router;
