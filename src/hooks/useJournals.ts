import { useCallback } from 'react';
import { useJournalContext } from '@/contexts/JournalContext';

export function useJournals() {
  const { state, dispatch, refreshJournals } = useJournalContext();

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, [dispatch]);

  const setSelectedCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
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
    loading: state.loading,
    error: state.error,
    searchQuery: state.searchQuery,
    selectedCategory: state.selectedCategory,
    minRating: state.minRating,
    sortBy: state.sortBy,
    setSearchQuery,
    setSelectedCategory,
    setMinRating,
    setSortBy,
    clearFilters,
    refreshJournals
  };
}