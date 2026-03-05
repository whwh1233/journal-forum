import { useState, useCallback, useRef } from 'react';
import { searchJournals, JournalSearchResult } from '../services/journalSearchService';

/**
 * useJournalSearch Hook
 * 管理期刊搜索状态和操作
 */
export const useJournalSearch = () => {
  const [results, setResults] = useState<JournalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 搜索期刊
   * @param query 搜索关键词
   * @param category 可选分类筛选
   * @param isLoadMore 是否为加载更多（追加结果）
   */
  const search = useCallback(async (
    query: string,
    category?: string,
    isLoadMore = false
  ) => {
    // 验证搜索关键词长度
    if (query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await searchJournals({
        q: query,
        category,
        page: currentPage,
        limit: 10
      });

      setResults(prev =>
        isLoadMore ? [...prev, ...response.results] : response.results
      );
      setHasMore(response.hasMore);
      setPage(currentPage);
    } catch (err: any) {
      // 忽略取消请求的错误
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError('搜索失败，请重试');
        console.error('Search error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  /**
   * 加载更多结果
   * @param query 搜索关键词
   * @param category 可选分类筛选
   */
  const loadMore = useCallback((query: string, category?: string) => {
    if (!loading && hasMore) {
      search(query, category, true);
    }
  }, [loading, hasMore, search]);

  /**
   * 重置搜索状态
   */
  const reset = useCallback(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    hasMore,
    search,
    loadMore,
    reset
  };
};
