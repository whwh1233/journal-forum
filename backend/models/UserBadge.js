const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserBadge = sequelize.define('UserBadge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    },
    badgeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'badge_id'
    },
    grantedBy: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        field: 'granted_by'
    },
    grantedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'granted_at'
    },
    isNew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_new'
    }
}, {
    tableName: 'user_badges',
    timestamps: false, // 使用自定义的 grantedAt
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'badge_id']
        }
    ]
});

module.exports = UserBadge;
