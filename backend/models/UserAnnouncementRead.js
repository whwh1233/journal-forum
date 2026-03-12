const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAnnouncementRead = sequelize.define('UserAnnouncementRead', {
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
    announcementId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'announcement_id'
    },
    readAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'read_at'
    },
    dismissed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'dismissed',
        comment: '紧急弹窗是否已确认关闭'
    }
}, {
    tableName: 'user_announcement_reads',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'announcement_id']
        }
    ]
});

module.exports = UserAnnouncementRead;
