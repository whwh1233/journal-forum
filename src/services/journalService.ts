import { Journal, PaginationInfo, Category } from '../types';

// API基础URL
const API_URL = '';

// 分页响应类型
export interface JournalPageResponse {
  journals: Journal[];
  pagination: PaginationInfo;
}

// 期刊服务
export const journalService = {
  // 获取期刊（支持分页）
  getJournals: async (
    search?: string,
    level?: string,
    minRating?: number,
    sortBy?: string,
    page: number = 1,
    limit: number = 12,
    categoryId?: number | null
  ): Promise<JournalPageResponse> => {
    let url = `${API_URL}/api/journals`;
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (level) params.append('level', level);
    if (minRating) params.append('minRating', minRating.toString());
    if (sortBy) params.append('sortBy', sortBy);
    if (categoryId) params.append('categoryId', categoryId.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('获取期刊数据失败');
    }

    const data = await response.json();
    return {
      journals: data.data.journals,
      pagination: data.data.pagination
    };
  },

  // 获取所有期刊（兼容旧接口）
  getAllJournals: async (
    search?: string,
    level?: string,
    minRating?: number,
    sortBy?: string
  ): Promise<Journal[]> => {
    const result = await journalService.getJournals(search, level, minRating, sortBy, 1, 1000);
    return result.journals;
  },

  // 根据ID获取期刊
  getJournalById: async (journalId: string): Promise<Journal | undefined> => {
    const response = await fetch(`${API_URL}/api/journals/${journalId}`);
    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    return data.data.journal;
  },

  // 动态获取等级分类选项列表
  getLevelOptions: async (): Promise<{ name: string, count: number }[]> => {
    try {
      const response = await fetch(`${API_URL}/api/journals/levels`);
      if (!response.ok) {
        throw new Error('获取期刊等级列表失败');
      }
      const data = await response.json();
      return data.data.levels;
    } catch (error) {
      console.error('Error fetching level options:', error);
      return [];
    }
  },

  // 获取分类列表（树形结构）
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch(`${API_URL}/api/journals/categories`);
      if (!response.ok) {
        throw new Error('获取分类列表失败');
      }
      const data = await response.json();
      return data.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
};