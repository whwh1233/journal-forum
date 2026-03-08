const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalCategoryMap = sequelize.define('JournalCategoryMap', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  journalId: {
    type: DataTypes.STRING(50),
    field: 'journal_id',
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id',
    allowNull: false
  }
}, {
  tableName: 'online_journal_category_map',
  timestamps: false
});

module.exports = JournalCategoryMap;
