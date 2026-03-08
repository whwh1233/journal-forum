const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Journal = sequelize.define('Journal', {
  journalId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'journal_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  supervisor: DataTypes.STRING(100),
  sponsor: DataTypes.STRING(255),
  issn: DataTypes.STRING(20),
  cn: DataTypes.STRING(20),
  publicationCycle: {
    type: DataTypes.STRING(20),
    field: 'publication_cycle'
  },
  // 数值指标
  articleCount: { type: DataTypes.INTEGER, field: 'article_count' },
  avgCitations: { type: DataTypes.FLOAT, field: 'avg_citations' },
  impactFactor: { type: DataTypes.FLOAT, field: 'impact_factor' },
  totalCitations: { type: DataTypes.INTEGER, field: 'total_citations' },
  downloadCount: { type: DataTypes.INTEGER, field: 'download_count' },
  fundPaperCount: { type: DataTypes.INTEGER, field: 'fund_paper_count' },
  otherCitationRate: { type: DataTypes.FLOAT, field: 'other_citation_rate' },
  // 文本字段
  fundPaperRate: { type: DataTypes.STRING(20), field: 'fund_paper_rate' },
  coverImageUrl: { type: DataTypes.STRING(255), field: 'cover_image_url' },
  formerName: { type: DataTypes.STRING(255), field: 'former_name' },
  editorInChief: { type: DataTypes.STRING(50), field: 'editor_in_chief' },
  language: DataTypes.STRING(20),
  address: DataTypes.STRING(255),
  postalCode: { type: DataTypes.STRING(20), field: 'postal_code' },
  email: DataTypes.STRING(500),
  phone: DataTypes.STRING(500),
  introduction: DataTypes.TEXT,
  // JSON 字段
  mainColumns: { type: DataTypes.JSON, field: 'main_columns' },
  awards: DataTypes.JSON,
  indexingHistory: { type: DataTypes.JSON, field: 'indexing_history' }
}, {
  tableName: 'online_journals',
  timestamps: false
});

module.exports = Journal;
