const API_URL = '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export interface DeployStatus {
  version: string;
  gitHash: string;
  gitBranch: string;
  commitMessage: string;
  commitAuthor: string;
  deployTime: string;
  frontendBuild: 'pending' | 'success' | 'failed';
  backendDeps: 'pending' | 'success' | 'failed';
  pm2Restart: 'pending' | 'success' | 'failed';
  overallStatus: 'pending' | 'success' | 'failed';
}

export interface HealthData {
  backend: { status: string; uptime: number; nodeVersion: string };
  database: { status: string; responseTime: number | null; error?: string };
  pm2: {
    status: 'ok' | 'error';
    error: string | null;
    processes: Array<{
      name: string;
      status: string;
      cpu: number;
      memory: number;
      uptime: number;
      restarts: number;
    }>;
  };
}

export interface DeployHistoryItem {
  version: string;
  gitHash: string;
  commitMessage: string;
  commitAuthor: string;
  deployTime: string;
  overallStatus: 'pending' | 'success' | 'failed';
}

export const deployService = {
  getStatus: async (): Promise<{ success: boolean; data: DeployStatus | null; message?: string }> => {
    const res = await fetch(`${API_URL}/api/deploy/status`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取部署状态失败');
    return res.json();
  },
  getHistory: async (limit = 20): Promise<{ success: boolean; data: DeployHistoryItem[]; total: number }> => {
    const res = await fetch(`${API_URL}/api/deploy/history?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取部署历史失败');
    return res.json();
  },
  getHealth: async (): Promise<{ success: boolean; data: HealthData }> => {
    const res = await fetch(`${API_URL}/api/deploy/health`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('获取健康状态失败');
    return res.json();
  },
};
