import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Journal, PaginationInfo, Category } from '@/types';
import { journalService } from '@/services/journalService';

// 排序字段类型：null=无排序, 'desc'=降序, 'asc'=升序
export type SortOrder = 'asc' | 'desc' | null;

// 排序字段状态
export type SortFields = Record<string, SortOrder>;

// 排序字段优先级（固定顺序）
export const SORT_FIELD_PRIORITY = [
  'commentCount',      // 评论数
  'impactFactor',      // 影响因子
  'rating',            // 综合评分
  'overallExperience', // 综合体验
  'reviewSpeed',       // 审稿速度
  'editorAttitude',    // 编辑态度
  'acceptDifficulty',  // 录用难度
  'reviewQuality'      // 审稿质量
] as const;

// 排序字段显示名称
export const SORT_FIELD_LABELS: Record<string, string> = {
  commentCount: '评论数',
  impactFactor: '影响因子',
  rating: '综合评分',
  overallExperience: '综合体验',
  reviewSpeed: '审稿速度',
  editorAttitude: '编辑态度',
  acceptDifficulty: '录用难度',
  reviewQuality: '审稿质量'
};

// 将 sortFields 转换为 API 参数格式
export const sortFieldsToString = (sortFields: SortFields): string => {
  const parts: string[] = [];
  for (const field of SORT_FIELD_PRIORITY) {
    const order = sortFields[field];
    if (order) {
      parts.push(`${field}:${order}`);
    }
  }
  return parts.join(',');
};

// 过滤状态类型
interface FilterState {
  searchQuery: string;
  selectedCategory: string; // 等级筛选 (selectedLevel)
  selectedCategoryId: number | null; // 分类筛选
  minRating: number;
  sortFields: SortFields;
  sortExpanded: boolean;
}

// Journal上下文状态
interface JournalState extends FilterState {
  journals: Journal[];
  filteredJournals: Journal[];
  levels: { name: string, count: number }[];
  categories: Category[]; // 分类树
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  hasMore: boolean;
}

// Action类型
type JournalAction =
  | { type: 'SET_JOURNALS'; payload: { journals: Journal[]; pagination: PaginationInfo } }
  | { type: 'APPEND_JOURNALS'; payload: { journals: Journal[]; pagination: PaginationInfo } }
  | { type: 'SET_LEVELS'; payload: { name: string, count: number }[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY_ID'; payload: number | null }
  | { type: 'SET_MIN_RATING'; payload: number }
  | { type: 'TOGGLE_SORT_FIELD'; payload: string }
  | { type: 'SET_SORT_EXPANDED'; payload: boolean }
  | { type: 'CLEAR_FILTERS' };

// 初始状态
const initialState: JournalState = {
  journals: [],
  filteredJournals: [],
  levels: [],
  categories: [],
  loading: false,
  loadingMore: false,
  error: null,
  searchQuery: '',
  selectedCategory: '',
  selectedCategoryId: null,
  minRating: 0,
  sortFields: {},
  sortExpanded: false,
  pagination: null,
  hasMore: true
};

// 切换排序字段状态：null -> desc -> asc -> null
const toggleSortOrder = (current: SortOrder): SortOrder => {
  if (current === null) return 'desc';
  if (current === 'desc') return 'asc';
  return null;
};

// Reducer函数
function journalReducer(state: JournalState, action: JournalAction): JournalState {
  switch (action.type) {
    case 'SET_JOURNALS': {
      const { journals, pagination } = action.payload;
      return {
        ...state,
        journals,
        filteredJournals: journals,
        pagination,
        hasMore: pagination.currentPage < pagination.totalPages,
        loading: false,
        error: null
      };
    }
    case 'APPEND_JOURNALS': {
      const { journals, pagination } = action.payload;
      const newJournals = [...state.journals, ...journals];
      // 如果返回空数据或已到最后一页，停止加载更多
      const hasMore = journals.length > 0 && pagination.currentPage < pagination.totalPages;
      return {
        ...state,
        journals: newJournals,
        filteredJournals: newJournals,
        pagination,
        hasMore,
        loadingMore: false
      };
    }
    case 'SET_LEVELS':
      return {
        ...state,
        levels: action.payload
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload
      };
    case 'SET_SELECTED_CATEGORY_ID':
      return {
        ...state,
        selectedCategoryId: action.payload
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOADING_MORE':
      return { ...state, loadingMore: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, loadingMore: false };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_MIN_RATING':
      return { ...state, minRating: action.payload };
    case 'TOGGLE_SORT_FIELD': {
      const field = action.payload;
      const currentOrder = state.sortFields[field] || null;
      const newOrder = toggleSortOrder(currentOrder);
      const newSortFields = { ...state.sortFields };
      if (newOrder === null) {
        delete newSortFields[field];
      } else {
        newSortFields[field] = newOrder;
      }
      return { ...state, sortFields: newSortFields };
    }
    case 'SET_SORT_EXPANDED':
      return { ...state, sortExpanded: action.payload };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchQuery: '',
        selectedCategory: '',
        selectedCategoryId: null,
        minRating: 0,
        sortFields: {},
        filteredJournals: state.journals
      };
    default:
      return state;
  }
}

// 过滤期刊的辅助函数（仅做本地筛选，不做排序，排序由后端处理）
function filterJournals(
  journals: Journal[],
  searchQuery: string,
  selectedCategory: string,
  minRating: number
): Journal[] {
  let filtered = [...journals];

  if (searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase();
    filtered = filtered.filter(journal =>
      journal.name.toLowerCase().includes(searchTerm) ||
      (journal.issn && journal.issn.toLowerCase().includes(searchTerm)) ||
      (journal.levels && journal.levels.some(l => l.toLowerCase().includes(searchTerm)))
    );
  }

  if (selectedCategory) {
    filtered = filtered.filter(journal =>
      journal.levels && journal.levels.includes(selectedCategory)
    );
  }

  if (minRating > 0) {
    filtered = filtered.filter(journal => {
      const rating = journal.ratingCache?.rating || 0;
      return rating >= minRating;
    });
  }

  // 注意：不在这里做排序，排序完全由后端处理
  // 前端重新排序会破坏后端的分页顺序

  return filtered;
}

// Context创建
const JournalContext = createContext<{
  state: JournalState;
  dispatch: React.Dispatch<JournalAction>;
  refreshJournals: () => Promise<void>;
  loadMoreJournals: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => { },
  refreshJournals: async () => { },
  loadMoreJournals: async () => { }
});

// Provider组件
export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(journalReducer, initialState);

  // 将 sortFields 转换为 API 参数字符串
  const sortByParam = sortFieldsToString(state.sortFields);

  // 刷新期刊数据（重新加载第一页）
  const refreshJournals = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await journalService.getJournals(
        state.searchQuery,
        state.selectedCategory,
        state.minRating,
        sortByParam,
        1,
        12,
        state.selectedCategoryId
      );
      dispatch({ type: 'SET_JOURNALS', payload: result });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '加载期刊数据失败'
      });
    }
  }, [state.searchQuery, state.selectedCategory, state.minRating, sortByParam, state.selectedCategoryId]);

  // 加载更多期刊
  const loadMoreJournals = useCallback(async () => {
    if (state.loadingMore || !state.hasMore || !state.pagination) return;

    try {
      dispatch({ type: 'SET_LOADING_MORE', payload: true });
      const nextPage = state.pagination.currentPage + 1;
      const result = await journalService.getJournals(
        state.searchQuery,
        state.selectedCategory,
        state.minRating,
        sortByParam,
        nextPage,
        12,
        state.selectedCategoryId
      );
      dispatch({ type: 'APPEND_JOURNALS', payload: result });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '加载更多期刊失败'
      });
    }
  }, [state.loadingMore, state.hasMore, state.pagination, state.searchQuery, state.selectedCategory, state.minRating, sortByParam, state.selectedCategoryId]);

  // 加载学科选项
  const loadLevels = useCallback(async () => {
    try {
      const levels = await journalService.getLevelOptions();
      dispatch({ type: 'SET_LEVELS', payload: levels });
    } catch (error) {
      console.error('Failed to load journal levels:', error);
    }
  }, []);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const categories = await journalService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      console.error('Failed to load journal categories:', error);
    }
  }, []);

  // 初始加载和过滤器变化时重新加载
  useEffect(() => {
    refreshJournals();
  }, [state.searchQuery, state.selectedCategory, state.selectedCategoryId, state.minRating, sortByParam, refreshJournals]);

  // 首次渲染加载 Levels 和 Categories
  useEffect(() => {
    loadLevels();
    loadCategories();
  }, [loadLevels, loadCategories]);

  // 单独处理filteredJournals的更新（仅本地筛选，排序由后端处理）
  const filteredJournals = filterJournals(
    state.journals,
    state.searchQuery,
    state.selectedCategory,
    state.minRating
  );

  return (
    <JournalContext.Provider
      value={{
        state: { ...state, filteredJournals },
        dispatch,
        refreshJournals,
        loadMoreJournals
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

// 自定义Hook
export function useJournalContext() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournalContext must be used within a JournalProvider');
  }
  return context;
}