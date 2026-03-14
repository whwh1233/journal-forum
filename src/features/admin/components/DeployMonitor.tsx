import React, { useState, useEffect, useCallback } from 'react';
import {
  deployService,
  DeployStatus,
  HealthData,
  DeployHistoryItem,
} from '../../../services/deployService';
import { usePageTitle } from '@/contexts/PageContext';
import {
  Server,
  Database,
  GitBranch,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Rocket,
  Activity,
} from 'lucide-react';
import './DeployMonitor.css';

const formatUptime = (seconds: number): string => {
  if (seconds < 60) return '< 1m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const statusDotClass = (
  value: string
): 'success' | 'error' | 'pending' => {
  if (['success', 'connected', 'running', 'online', 'ok'].includes(value.toLowerCase())) return 'success';
  if (['failed', 'disconnected', 'error', 'stopped', 'errored'].includes(value.toLowerCase())) return 'error';
  return 'pending';
};

const StepIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'success') return <CheckCircle size={12} />;
  if (status === 'failed') return <XCircle size={12} />;
  return <AlertCircle size={12} />;
};

const DeployMonitor: React.FC = () => {
  usePageTitle('部署监控');

  const [status, setStatus] = useState<DeployStatus | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<DeployHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      const [statusRes, historyRes, healthRes] = await Promise.all([
        deployService.getStatus(),
        deployService.getHistory(),
        deployService.getHealth(),
      ]);
      setStatus(statusRes.data);
      setHistory(historyRes.data);
      setHealth(healthRes.data);
    } catch (err: any) {
      setError(err.message || '获取部署数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh health every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const healthRes = await deployService.getHealth();
        setHealth(healthRes.data);
      } catch {
        // silent fail for background refresh
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="deploy-monitor">
        <div className="page-wrapper">
          <div className="deploy-loading">
            <div className="loading-spinner"></div>
            <p>正在加载部署信息...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deploy-monitor">
      <div className="page-wrapper">
        {/* Header */}
        <div className="deploy-header">
          <h2><Rocket size={24} /> 部署监控</h2>
          <button
            className={`deploy-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="deploy-error">
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* No deploy data */}
        {!status && !error && (
          <div className="deploy-empty">
            <Rocket size={48} />
            <p>暂无部署记录</p>
          </div>
        )}

        {/* Cards */}
        {(status || health) && (
          <div className="deploy-cards">
            {/* Version card */}
            {status && (
              <div className="deploy-card">
                <div className="deploy-card-header">
                  <GitBranch size={20} />
                  <h3>当前版本</h3>
                  <span
                    className={`deploy-status-badge ${status.overallStatus}`}
                  >
                    <span
                      className={`status-dot ${statusDotClass(status.overallStatus)}`}
                    />
                    {status.overallStatus === 'success'
                      ? '部署成功'
                      : status.overallStatus === 'failed'
                        ? '部署失败'
                        : '部署中'}
                  </span>
                </div>

                <div className="deploy-version-info">
                  <div className="deploy-info-row">
                    <Rocket size={16} />
                    <span className="deploy-info-label">版本</span>
                    <span className="deploy-info-value version-tag">
                      {status.version}
                    </span>
                  </div>
                  <div className="deploy-info-row">
                    <Activity size={16} />
                    <span className="deploy-info-label">Commit</span>
                    <span className="deploy-info-value mono">
                      {status.gitHash.substring(0, 8)}
                    </span>
                  </div>
                  <div className="deploy-info-row">
                    <GitBranch size={16} />
                    <span className="deploy-info-label">分支</span>
                    <span className="deploy-info-value mono">
                      {status.gitBranch}
                    </span>
                  </div>
                  <div className="deploy-info-row">
                    <Clock size={16} />
                    <span className="deploy-info-label">时间</span>
                    <span className="deploy-info-value">
                      {formatTime(status.deployTime)}
                    </span>
                  </div>
                  <div className="deploy-info-row">
                    <Server size={16} />
                    <span className="deploy-info-label">提交说明</span>
                    <span className="deploy-info-value">
                      {status.commitMessage}
                    </span>
                  </div>
                  <div className="deploy-info-row">
                    <Activity size={16} />
                    <span className="deploy-info-label">作者</span>
                    <span className="deploy-info-value">
                      {status.commitAuthor}
                    </span>
                  </div>
                </div>

                {/* Step badges */}
                <div className="deploy-steps">
                  <span className={`step-badge ${status.frontendBuild}`}>
                    <StepIcon status={status.frontendBuild} />
                    前端构建
                  </span>
                  <span className={`step-badge ${status.backendDeps}`}>
                    <StepIcon status={status.backendDeps} />
                    后端依赖
                  </span>
                  <span className={`step-badge ${status.pm2Restart}`}>
                    <StepIcon status={status.pm2Restart} />
                    PM2 重启
                  </span>
                </div>
              </div>
            )}

            {/* Health card */}
            {health && (
              <div className="deploy-card">
                <div className="deploy-card-header">
                  <Activity size={20} />
                  <h3>服务健康状态</h3>
                </div>

                {/* Backend */}
                <div className="health-section">
                  <div className="health-section-title">
                    <Server size={14} />
                    <span
                      className={`status-dot ${statusDotClass(health.backend.status)}`}
                    />
                    后端服务
                  </div>
                  <div className="health-detail">
                    <div className="health-detail-item">
                      <span className="label">状态</span>
                      <span className="value">{health.backend.status}</span>
                    </div>
                    <div className="health-detail-item">
                      <span className="label">运行时间</span>
                      <span className="value mono">
                        {formatUptime(health.backend.uptime)}
                      </span>
                    </div>
                    <div className="health-detail-item">
                      <span className="label">Node 版本</span>
                      <span className="value mono">
                        {health.backend.nodeVersion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Database */}
                <div className="health-section">
                  <div className="health-section-title">
                    <Database size={14} />
                    <span
                      className={`status-dot ${statusDotClass(health.database.status)}`}
                    />
                    数据库
                  </div>
                  <div className="health-detail">
                    <div className="health-detail-item">
                      <span className="label">状态</span>
                      <span className="value">{health.database.status}</span>
                    </div>
                    <div className="health-detail-item">
                      <span className="label">响应时间</span>
                      <span className="value mono">
                        {health.database.responseTime !== null
                          ? `${health.database.responseTime}ms`
                          : '-'}
                      </span>
                    </div>
                    {health.database.error && (
                      <div className="health-detail-item">
                        <span className="label">错误</span>
                        <span className="value" style={{ color: '#dc2626' }}>
                          {health.database.error}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PM2 */}
                <div className="health-section">
                  <div className="health-section-title">
                    <Activity size={14} />
                    <span
                      className={`status-dot ${statusDotClass(health.pm2.status)}`}
                    />
                    PM2 进程
                  </div>
                  {health.pm2.error ? (
                    <div className="health-detail">
                      <div className="health-detail-item">
                        <span className="label">错误</span>
                        <span className="value" style={{ color: '#dc2626' }}>
                          {health.pm2.error}
                        </span>
                      </div>
                    </div>
                  ) : health.pm2.processes.length > 0 ? (
                    <table className="pm2-processes">
                      <thead>
                        <tr>
                          <th>名称</th>
                          <th>状态</th>
                          <th>CPU</th>
                          <th>内存</th>
                          <th>运行时间</th>
                          <th>重启次数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {health.pm2.processes.map((proc) => (
                          <tr key={proc.name}>
                            <td className="mono">{proc.name}</td>
                            <td>
                              <span
                                className={`status-dot ${statusDotClass(proc.status)}`}
                              />{' '}
                              {proc.status}
                            </td>
                            <td className="mono">{proc.cpu}%</td>
                            <td className="mono">
                              {(proc.memory / 1024 / 1024).toFixed(1)} MB
                            </td>
                            <td className="mono">
                              {formatUptime(proc.uptime / 1000)}
                            </td>
                            <td className="mono">{proc.restarts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="health-detail">
                      <span className="value">无进程数据</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deploy history */}
        <div className="deploy-history">
          <div className="deploy-history-header">
            <Clock size={20} />
            <h3>部署历史</h3>
          </div>
          {history.length > 0 ? (
            <div className="deploy-history-table-container">
              <table className="deploy-history-table">
                <thead>
                  <tr>
                    <th>版本</th>
                    <th>Commit</th>
                    <th>提交说明</th>
                    <th>作者</th>
                    <th>部署时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr key={`${item.version}-${idx}`}>
                      <td className="mono">{item.version}</td>
                      <td className="mono">{item.gitHash.substring(0, 8)}</td>
                      <td>
                        <span className="commit-msg" title={item.commitMessage}>
                          {item.commitMessage}
                        </span>
                      </td>
                      <td>{item.commitAuthor}</td>
                      <td>{formatTime(item.deployTime)}</td>
                      <td>
                        <span
                          className={`deploy-status-badge ${item.overallStatus}`}
                        >
                          <span
                            className={`status-dot ${statusDotClass(item.overallStatus)}`}
                          />
                          {item.overallStatus === 'success'
                            ? '成功'
                            : item.overallStatus === 'failed'
                              ? '失败'
                              : '进行中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="deploy-empty">
              <Clock size={36} />
              <p>暂无部署历史</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeployMonitor;
