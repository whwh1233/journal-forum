const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Badge = sequelize.define('Badge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    color: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('activity', 'identity', 'honor'),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false
    },
    triggerCondition: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'trigger_condition'
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'badges',
    updatedAt: false
});

module.exports = Badge;
