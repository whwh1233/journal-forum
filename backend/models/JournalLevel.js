const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalLevel = sequelize.define('JournalLevel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  journalId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'journal_id'
  },
  levelName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'level_name'
  }
}, {
  tableName: 'online_journal_levels',
  timestamps: false
});

module.exports = JournalLevel;
