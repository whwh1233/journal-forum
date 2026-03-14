const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { exec } = require('child_process');

const STATUS_FILE = path.join(__dirname, '..', 'deploy-status.json');
const HISTORY_FILE = path.join(__dirname, '..', 'deploy-history.json');

/**
 * GET /api/deploy/status
 * 返回当前部署状态
 */
const getDeployStatus = async (req, res) => {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return res.json({ success: true, data: null, message: '暂无部署记录' });
    }
    const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get deploy status error:', error);
    res.status(500).json({ success: false, message: '获取部署状态失败', error: error.message });
  }
};

/**
 * GET /api/deploy/history
 * 返回部署历史记录
 */
const getDeployHistory = async (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.json({ success: true, data: [], total: 0 });
    }
    const allHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const data = allHistory.slice(0, limit);
    res.json({ success: true, data, total: allHistory.length });
  } catch (error) {
    console.error('Get deploy history error:', error);
    res.status(500).json({ success: false, message: '获取部署历史失败', error: error.message });
  }
};

/**
 * GET /api/deploy/health
 * 返回实时健康状态
 */
const getHealthStatus = async (req, res) => {
  try {
    // 1. 后端进程信息
    const backend = {
      status: 'running',
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version
    };

    // 2. 数据库健康检查
    let database;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      database = { status: 'connected', responseTime: Date.now() - start };
    } catch (dbError) {
      database = { status: 'disconnected', responseTime: null, error: dbError.message };
    }

    // 3. PM2 进程状态
    const pm2 = await new Promise((resolve) => {
      exec('pm2 jlist', { timeout: 5000, encoding: 'utf8' }, (error, stdout) => {
        if (error) {
          return resolve({ status: 'error', error: error.message, processes: [] });
        }
        try {
          const list = JSON.parse(stdout);
          const processes = list.map(p => ({
            name: p.name,
            status: p.pm2_env?.status || 'unknown',
            cpu: p.monit?.cpu || 0,
            memory: parseFloat(((p.monit?.memory || 0) / 1024 / 1024).toFixed(1)),
            uptime: p.pm2_env?.pm_uptime ? Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0,
            restarts: p.pm2_env?.restart_time || 0
          }));
          resolve({ status: 'ok', error: null, processes });
        } catch (parseError) {
          resolve({ status: 'error', error: 'Failed to parse PM2 output', processes: [] });
        }
      });
    });

    res.json({ success: true, data: { backend, database, pm2 } });
  } catch (error) {
    console.error('Get health status error:', error);
    res.status(500).json({ success: false, message: '获取健康状态失败', error: error.message });
  }
};

module.exports = { getDeployStatus, getDeployHistory, getHealthStatus };
