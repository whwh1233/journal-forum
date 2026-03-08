import { useCallback } from 'react';
import { useJournalContext } from '@/contexts/JournalContext';

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

  const setSortBy = useCallback((sortBy: string) => {
    dispatch({ type: 'SET_SORT_BY', payload: sortBy });
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

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
    sortBy: state.sortBy,
    hasMore: state.hasMore,
    pagination: state.pagination,
    setSearchQuery,
    setSelectedCategory,
    setSelectedCategoryId,
    setMinRating,
    setSortBy,
    clearFilters,
    refreshJournals,
    loadMoreJournals
  };
}
