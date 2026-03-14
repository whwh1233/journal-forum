const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

const {
  getDeployStatus,
  getDeployHistory,
  getHealthStatus
} = require('../../controllers/deployController');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/deploy/status', getDeployStatus);
  app.get('/api/deploy/history', getDeployHistory);
  app.get('/api/deploy/health', getHealthStatus);
  return app;
};

describe('Deploy API', () => {
  let app;
  const statusFile = path.join(__dirname, '..', '..', 'deploy-status.json');
  const historyFile = path.join(__dirname, '..', '..', 'deploy-history.json');

  beforeAll(() => {
    app = createTestApp();
  });

  afterEach(() => {
    try { fs.unlinkSync(statusFile); } catch(e) {}
    try { fs.unlinkSync(historyFile); } catch(e) {}
  });

  describe('GET /api/deploy/status', () => {
    it('should return null with message when no status file exists', async () => {
      const res = await request(app).get('/api/deploy/status').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
      expect(res.body.message).toBe('暂无部署记录');
    });

    it('should return status when file exists', async () => {
      const mockStatus = {
        version: '0.1.0',
        gitHash: 'abc1234',
        gitBranch: 'main',
        overallStatus: 'success'
      };
      fs.writeFileSync(statusFile, JSON.stringify(mockStatus));

      const res = await request(app).get('/api/deploy/status').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('0.1.0');
      expect(res.body.data.gitHash).toBe('abc1234');
    });

    it('should return 500 on malformed JSON', async () => {
      fs.writeFileSync(statusFile, '{invalid json}');
      const res = await request(app).get('/api/deploy/status').expect(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/deploy/history', () => {
    it('should return empty array when no history file', async () => {
      const res = await request(app).get('/api/deploy/history').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return history with default limit', async () => {
      const history = Array.from({ length: 25 }, (_, i) => ({
        version: '0.1.0',
        gitHash: `hash${i}`,
        overallStatus: 'success'
      }));
      fs.writeFileSync(historyFile, JSON.stringify(history));

      const res = await request(app).get('/api/deploy/history').expect(200);
      expect(res.body.data).toHaveLength(20);
      expect(res.body.total).toBe(25);
    });

    it('should respect limit parameter', async () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        version: '0.1.0',
        gitHash: `hash${i}`,
        overallStatus: 'success'
      }));
      fs.writeFileSync(historyFile, JSON.stringify(history));

      const res = await request(app).get('/api/deploy/history?limit=3').expect(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.total).toBe(10);
    });
  });

  describe('GET /api/deploy/health', () => {
    it('should return health data with correct shape', async () => {
      const res = await request(app).get('/api/deploy/health').expect(200);
      expect(res.body.success).toBe(true);

      expect(res.body.data.backend.status).toBe('running');
      expect(res.body.data.backend.nodeVersion).toMatch(/^v\d+/);
      expect(typeof res.body.data.backend.uptime).toBe('number');

      expect(res.body.data.database).toHaveProperty('status');
      expect(['connected', 'disconnected']).toContain(res.body.data.database.status);

      expect(res.body.data.pm2).toHaveProperty('status');
      expect(res.body.data.pm2).toHaveProperty('processes');
      expect(Array.isArray(res.body.data.pm2.processes)).toBe(true);
    });
  });
});
