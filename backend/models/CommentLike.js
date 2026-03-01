const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentLike = sequelize.define('CommentLike', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    commentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'comment_id'
    },
    userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id'
    }
}, {
    tableName: 'comment_likes',
    updatedAt: false, // 只需要 createdAt
    indexes: [
        {
            unique: true,
            fields: ['comment_id', 'user_id']
        }
    ]
});

module.exports = CommentLike;
