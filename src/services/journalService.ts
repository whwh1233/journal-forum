import { Journal, CategoryMap } from '../types';

// API基础URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 学科映射
export const categoryMap: CategoryMap = {
  'computer-science': '计算机科学',
  'biology': '生物学',
  'physics': '物理学',
  'chemistry': '化学',
  'mathematics': '数学',
  'medicine': '医学'
};

// 期刊服务
export const journalService = {
  // 获取所有期刊
  getAllJournals: async (
    search?: string,
    category?: string,
    minRating?: number
  ): Promise<Journal[]> => {
    let url = `${API_URL}/api/journals`;
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (minRating) params.append('minRating', minRating.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('获取期刊数据失败');
    }

    const data = await response.json();
    return data.data.journals;
  },

  // 根据ID获取期刊
  getJournalById: async (id: number): Promise<Journal | undefined> => {
    const response = await fetch(`${API_URL}/api/journals/${id}`);
    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    return data.data.journal;
  },

  // 添加期刊评论
  addJournalReview: async (
    journalId: number,
    author: string,
    rating: number,
    content: string
  ): Promise<Journal> => {
    const response = await fetch(`${API_URL}/api/journals/${journalId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ author, rating, content }),
    });

    if (!response.ok) {
      throw new Error('添加评论失败');
    }

    const data = await response.json();
    return data.data.journal;
  },

  // 获取所有学科分类
  getAllCategories: (): string[] => {
    return Object.keys(categoryMap);
  }
};