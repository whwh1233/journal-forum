const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  configKey: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'config_key'
  },
  configValue: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'config_value'
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  }
}, {
  tableName: 'online_system_config'
});

SystemConfig.getValue = async function(key, defaultValue = null) {
  const config = await this.findByPk(key);
  return config ? config.configValue : defaultValue;
};

SystemConfig.setValue = async function(key, value, description = null) {
  const [config] = await this.upsert({
    configKey: key,
    configValue: String(value),
    ...(description && { description })
  });
  return config;
};

module.exports = SystemConfig;
