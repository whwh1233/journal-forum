const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalCategoryMap = sequelize.define('JournalCategoryMap', {
  journalId: {
    type: DataTypes.STRING(50),
    field: 'journal_id',
    primaryKey: true,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id',
    primaryKey: true,
    allowNull: false
  }
}, {
  tableName: 'online_journal_category_map',
  timestamps: false
});

module.exports = JournalCategoryMap;
