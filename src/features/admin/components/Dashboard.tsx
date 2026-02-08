import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { AdminStats } from '../../../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">仪表盘</h1>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/users')}>
          <div className="stat-icon users-icon">&#128101;</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.userCount || 0}</div>
            <div className="stat-label">用户总数</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/journals')}>
          <div className="stat-icon journals-icon">&#128214;</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.journalCount || 0}</div>
            <div className="stat-label">期刊总数</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/comments')}>
          <div className="stat-icon comments-icon">&#128172;</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.commentCount || 0}</div>
            <div className="stat-label">评论总数</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">快捷操作</h2>
        <div className="action-buttons">
          <button className="action-button" onClick={() => navigate('/admin/users')}>
            <span className="action-icon">&#128101;</span>
            用户管理
          </button>
          <button className="action-button" onClick={() => navigate('/admin/journals')}>
            <span className="action-icon">&#128214;</span>
            期刊管理
          </button>
          <button className="action-button" onClick={() => navigate('/admin/comments')}>
            <span className="action-icon">&#128172;</span>
            评论管理
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
