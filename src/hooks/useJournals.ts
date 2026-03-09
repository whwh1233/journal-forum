import { useCallback } from 'react';
import { useJournalContext, SortFields, SortOrder } from '@/contexts/JournalContext';

export function useJournals() {
  const { state, dispatch, refreshJournals, loadMoreJournals } = useJournalContext();

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const setSelectedCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  }, [dispatch]);

  const setSelectedCategoryId = useCallback((categoryId: number | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY_ID', payload: categoryId });
  }, [dispatch]);

  const setMinRating = useCallback((rating: number) => {
    dispatch({ type: 'SET_MIN_RATING', payload: rating });
  }, [dispatch]);

  const toggleSortField = useCallback((field: string) => {
    dispatch({ type: 'TOGGLE_SORT_FIELD', payload: field });
  }, [dispatch]);

  const setSortExpanded = useCallback((expanded: boolean) => {
    dispatch({ type: 'SET_SORT_EXPANDED', payload: expanded });
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

  // 检查是否有激活的排序
  const hasActiveSorts = Object.keys(state.sortFields).length > 0;

  return {
    journals: state.journals,
    filteredJournals: state.filteredJournals,
    levels: state.levels,
    categories: state.categories,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    searchQuery: state.searchQuery,
    selectedCategory: state.selectedCategory,
    selectedCategoryId: state.selectedCategoryId,
    minRating: state.minRating,
    sortFields: state.sortFields,
    sortExpanded: state.sortExpanded,
    hasActiveSorts,
    hasMore: state.hasMore,
    pagination: state.pagination,
    setSearchQuery,
    setSelectedCategory,
    setSelectedCategoryId,
    setMinRating,
    toggleSortField,
    setSortExpanded,
    clearFilters,
    refreshJournals,
    loadMoreJournals
  };
}

// 重新导出类型
export type { SortFields, SortOrder };
