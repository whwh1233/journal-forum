import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { AdminStats } from '../../../types';
import { Users, BookOpen, MessageSquare, Award } from 'lucide-react';
import PageHeader from '../../../components/layout/PageHeader';
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
      <div className="page-wrapper">
        <div className="dashboard-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="dashboard-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <PageHeader title="仪表盘" />
      <div className="page-wrapper">
        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/admin/users')}>
            <div className="stat-icon users-icon"><Users size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.userCount || 0}</div>
              <div className="stat-label">用户总数</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/journals')}>
            <div className="stat-icon journals-icon"><BookOpen size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.journalCount || 0}</div>
              <div className="stat-label">期刊总数</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/comments')}>
            <div className="stat-icon comments-icon"><MessageSquare size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.commentCount || 0}</div>
              <div className="stat-label">评论总数</div>
            </div>
          </div>

          <div className="stat-card" onClick={() => navigate('/admin/badges')}>
            <div className="stat-icon badges-icon"><Award size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">荣誉系统</div>
              <div className="stat-label">功能区</div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2 className="section-title">快捷操作</h2>
          <div className="action-buttons">
            <button className="action-button" onClick={() => navigate('/admin/users')}>
              <Users className="action-icon" size={32} />
              用户管理
            </button>
            <button className="action-button" onClick={() => navigate('/admin/journals')}>
              <BookOpen className="action-icon" size={32} />
              期刊管理
            </button>
            <button className="action-button" onClick={() => navigate('/admin/comments')}>
              <MessageSquare className="action-icon" size={32} />
              评论管理
            </button>
            <button className="action-button" onClick={() => navigate('/admin/badges')}>
              <Award className="action-icon" size={32} />
              徽章与荣誉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
