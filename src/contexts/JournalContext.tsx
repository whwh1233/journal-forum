import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Journal } from '@/types';
import { journalService } from '@/services/journalService';

// 过滤状态类型
interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  minRating: number;
}

// Journal上下文状态
interface JournalState extends FilterState {
  journals: Journal[];
  filteredJournals: Journal[];
  loading: boolean;
  error: string | null;
}

// Action类型
type JournalAction =
  | { type: 'SET_JOURNALS'; payload: Journal[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_MIN_RATING'; payload: number }
  | { type: 'CLEAR_FILTERS' };

// 初始状态
const initialState: JournalState = {
  journals: [],
  filteredJournals: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: '',
  minRating: 0
};

// Reducer函数
function journalReducer(state: JournalState, action: JournalAction): JournalState {
  switch (action.type) {
    case 'SET_JOURNALS':
      return {
        ...state,
        journals: action.payload,
        filteredJournals: action.payload,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_MIN_RATING':
      return { ...state, minRating: action.payload };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchQuery: '',
        selectedCategory: '',
        minRating: 0,
        filteredJournals: state.journals
      };
    default:
      return state;
  }
}

// 过滤期刊的辅助函数
function filterJournals(
  journals: Journal[],
  searchQuery: string,
  selectedCategory: string,
  minRating: number
): Journal[] {
  let filtered = [...journals];

  // 按搜索关键词过滤
  if (searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase();
    filtered = filtered.filter(journal =>
      journal.title.toLowerCase().includes(searchTerm) ||
      journal.issn.toLowerCase().includes(searchTerm) ||
      journal.category.toLowerCase().includes(searchTerm)
    );
  }

  // 按学科过滤
  if (selectedCategory) {
    filtered = filtered.filter(journal => journal.category === selectedCategory);
  }

  // 按评分过滤
  if (minRating > 0) {
    filtered = filtered.filter(journal => journal.rating >= minRating);
  }

  return filtered;
}

// Context创建
const JournalContext = createContext<{
  state: JournalState;
  dispatch: React.Dispatch<JournalAction>;
  refreshJournals: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => {},
  refreshJournals: async () => {}
});

// Provider组件
export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(journalReducer, initialState);

  // 刷新期刊数据
  const refreshJournals = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const journals = await journalService.getAllJournals(
        state.searchQuery,
        state.selectedCategory,
        state.minRating
      );
      dispatch({ type: 'SET_JOURNALS', payload: journals });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '加载期刊数据失败'
      });
    }
  }, [state.searchQuery, state.selectedCategory, state.minRating]);

  // 初始加载和过滤器变化时重新加载
  useEffect(() => {
    refreshJournals();
  }, [state.searchQuery, state.selectedCategory, state.minRating, refreshJournals]);

  // 单独处理filteredJournals的更新
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
        refreshJournals
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