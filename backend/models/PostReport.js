const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostReport = sequelize.define('PostReport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    reporterId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'reporter_id'
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'post_reports',
    indexes: [
        { fields: ['post_id'] },
        { fields: ['reporter_id'] },
        { fields: ['status'] }
    ]
});

module.exports = PostReport;
