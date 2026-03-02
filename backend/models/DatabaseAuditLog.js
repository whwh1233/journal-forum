const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DatabaseAuditLog = sequelize.define('DatabaseAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tableName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'table_name'
  },
  operation: {
    type: DataTypes.ENUM('UPDATE', 'DELETE'),
    allowNull: false
  },
  rowId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'row_id',
    comment: '被操作行的主键值'
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'old_data',
    comment: '操作前的数据'
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'new_data',
    comment: '操作后的数据（仅 UPDATE）'
  },
  operatorId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    field: 'operator_id'
  },
  operatorEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'operator_email'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  }
}, {
  tableName: 'database_audit_logs',
  updatedAt: false,
  indexes: [
    { fields: ['table_name'] },
    { fields: ['operator_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = DatabaseAuditLog;
