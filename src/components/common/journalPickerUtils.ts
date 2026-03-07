import type { JournalSearchResult } from '../../services/journalSearchService';

/**
 * 创建自定义期刊对象（id 为 0 表示未关联到系统期刊）
 */
export const createCustomJournal = (title: string): JournalSearchResult & { isCustom: boolean } => ({
  id: 0,
  title: title.trim(),
  issn: '',
  category: '自定义',
  rating: 0,
  reviews: 0,
  dimensionAverages: {},
  isCustom: true
});

/**
 * 检查是否为自定义期刊
 */
export const isCustomJournal = (journal: JournalSearchResult | null): boolean => {
  return journal?.id === 0 || (journal as any)?.isCustom === true;
};
