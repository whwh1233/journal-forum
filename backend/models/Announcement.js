const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.CHAR(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '发布/生效时间，空则立即生效'
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '下线/过期时间，空则永久有效'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '启停状态'
    },
    creatorId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'creator_id',
        comment: '发布管理员的ID'
    }
}, {
    tableName: 'announcements',
    timestamps: true
});

module.exports = Announcement;
