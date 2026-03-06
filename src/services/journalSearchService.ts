import axios from 'axios';

/**
 * 期刊搜索参数接口
 */
export interface JournalSearchParams {
  q: string;
  category?: string;
  page?: number;
  limit?: number;
}

/**
 * 期刊搜索结果接口
 */
export interface JournalSearchResult {
  id: number;
  title: string;
  issn: string;
  category: string;
  rating: number;
  reviews: number;
  description?: string;
  dimensionAverages: {
    reviewSpeed?: number;
    editorAttitude?: number;
    acceptDifficulty?: number;
    reviewQuality?: number;
    overallExperience?: number;
  };
}

/**
 * 期刊搜索响应接口
 */
export interface JournalSearchResponse {
  results: JournalSearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * 分类项接口
 */
export interface CategoryItem {
  name: string;
  count: number;
}

/**
 * 分类响应接口
 */
export interface CategoriesResponse {
  categories: CategoryItem[];
}

/**
 * 搜索期刊
 * @param params 搜索参数
 * @returns 搜索结果
 */
export const searchJournals = async (
  params: JournalSearchParams
): Promise<JournalSearchResponse> => {
  const response = await axios.get('/api/journals/search', { params });

  // 适配后端响应格式
  const { journals, hasMore } = response.data.data;

  return {
    results: journals,
    total: journals.length, // 后端未返回 total，暂用 results.length
    page: params.page || 1,
    limit: params.limit || 10,
    hasMore
  };
};

/**
 * 获取期刊分类列表
 * @returns 分类列表
 */
export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await axios.get('/api/journals/categories');
  return response.data.data;
};

/**
 * 根据ID获取期刊详情（转换为 JournalSearchResult 格式）
 * @param id 期刊ID
 * @returns 期刊搜索结果
 */
export const getJournalById = async (id: string | number): Promise<JournalSearchResult> => {
  const response = await axios.get(`/api/journals/${id}`);
  const journal = response.data.data.journal;

  // 转换为 JournalSearchResult 格式
  return {
    id: journal.id,
    title: journal.title,
    issn: journal.issn,
    category: journal.category,
    rating: journal.rating,
    reviews: Array.isArray(journal.reviews) ? journal.reviews.length : 0,
    description: journal.description,
    dimensionAverages: journal.dimensionAverages || {}
  };
};
