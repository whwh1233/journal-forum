import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DeployMonitor from '@/features/admin/components/DeployMonitor';

// Mock PageContext
vi.mock('@/contexts/PageContext', () => ({
  usePageTitle: vi.fn(),
}));

// Mock deploy service
vi.mock('@/services/deployService', () => ({
  deployService: {
    getStatus: vi.fn(),
    getHistory: vi.fn(),
    getHealth: vi.fn(),
  },
}));

import { deployService } from '@/services/deployService';

const mockStatus = {
  success: true,
  data: {
    version: '0.1.0',
    gitHash: 'abc1234',
    gitBranch: 'main',
    commitMessage: 'feat: test',
    commitAuthor: 'wwj',
    deployTime: '2026-03-14T15:30:00+08:00',
    frontendBuild: 'success',
    backendDeps: 'success',
    pm2Restart: 'success',
    overallStatus: 'success',
  },
};

const mockHistory = {
  success: true,
  data: [
    { version: '0.1.0', gitHash: 'abc1234', commitMessage: 'feat: test', commitAuthor: 'wwj', deployTime: '2026-03-14T15:30:00+08:00', overallStatus: 'success' },
    { version: '0.1.0', gitHash: 'def5678', commitMessage: 'fix: bug', commitAuthor: 'wwj', deployTime: '2026-03-13T10:00:00+08:00', overallStatus: 'failed' },
  ],
  total: 2,
};

const mockHealth = {
  success: true,
  data: {
    backend: { status: 'running', uptime: 3600, nodeVersion: 'v18.17.0' },
    database: { status: 'connected', responseTime: 12 },
    pm2: { status: 'ok', error: null, processes: [{ name: 'backend', status: 'online', cpu: 2.1, memory: 85.6, uptime: 3600, restarts: 0 }] },
  },
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <DeployMonitor />
    </BrowserRouter>
  );
};

describe('DeployMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (deployService.getStatus as Mock).mockResolvedValue(mockStatus);
    (deployService.getHistory as Mock).mockResolvedValue(mockHistory);
    (deployService.getHealth as Mock).mockResolvedValue(mockHealth);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(deployService.getStatus).toHaveBeenCalled();
    expect(screen.getByText('正在加载部署信息...')).toBeInTheDocument();
  });

  it('renders deploy status with version info', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('0.1.0').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('当前版本')).toBeInTheDocument();
    expect(screen.getByText('部署成功')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('renders health status for backend and database', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('v18.17.0')).toBeInTheDocument();
    });

    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('12ms')).toBeInTheDocument();
  });

  it('renders deploy history table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('def5678')).toBeInTheDocument();
    });

    expect(screen.getAllByText('feat: test').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('fix: bug')).toBeInTheDocument();
    expect(screen.getByText('成功')).toBeInTheDocument();
    expect(screen.getByText('失败')).toBeInTheDocument();
  });

  it('shows message when no deploy status exists', async () => {
    (deployService.getStatus as Mock).mockResolvedValue({ success: true, data: null });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('暂无部署记录')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    (deployService.getStatus as Mock).mockRejectedValue(new Error('获取部署数据失败'));
    (deployService.getHistory as Mock).mockRejectedValue(new Error('获取部署数据失败'));
    (deployService.getHealth as Mock).mockRejectedValue(new Error('获取部署数据失败'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('获取部署数据失败')).toBeInTheDocument();
    });
  });

  it('auto-refreshes health data every 30 seconds', async () => {
    vi.useFakeTimers();

    renderComponent();

    // Flush initial promises by advancing a tiny amount
    await vi.advanceTimersByTimeAsync(10);

    const initialCalls = (deployService.getHealth as Mock).mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    // Advance past the 30s interval
    await vi.advanceTimersByTimeAsync(30000);

    expect((deployService.getHealth as Mock).mock.calls.length).toBeGreaterThan(initialCalls);
  }, 10000);
});
