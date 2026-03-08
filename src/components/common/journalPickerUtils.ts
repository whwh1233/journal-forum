import type { JournalSearchResult } from '../../services/journalSearchService';

/**
 * 创建自定义期刊对象（journalId 为空字符串表示未关联到系统期刊）
 */
export const createCustomJournal = (name: string): JournalSearchResult & { isCustom: boolean } => ({
  id: '',              // 兼容旧代码
  journalId: '',       // 新字段
  title: name.trim(),  // 兼容旧代码
  name: name.trim(),   // 新字段
  issn: '',
  category: '自定义',  // 兼容旧代码
  levels: ['自定义'],  // 新字段
  rating: 0,
  reviews: 0,
  dimensionAverages: {},
  isCustom: true
});

/**
 * 检查是否为自定义期刊
 */
export const isCustomJournal = (journal: JournalSearchResult | null): boolean => {
  return !journal?.journalId || journal?.journalId === '' || (journal as any)?.isCustom === true;
};
