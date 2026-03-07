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
