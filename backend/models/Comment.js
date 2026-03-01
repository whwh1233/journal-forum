const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // 保留旧版字符串 ID，用于数据迁移兼容
    legacyId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'legacy_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    },
    userName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'user_name'
    },
    journalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'journal_id'
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    rating: {
        type: DataTypes.TINYINT,
        allowNull: true,
        validate: {
            min: { args: [1], msg: '评分最低为1分' },
            max: { args: [5], msg: '评分最高为5分' }
        }
    },
    dimensionRatings: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'dimension_ratings'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    },
    likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count'
    }
}, {
    tableName: 'comments',
    indexes: [
        { fields: ['journal_id'] },
        { fields: ['user_id'] },
        { fields: ['parent_id'] }
    ]
});

module.exports = Comment;
