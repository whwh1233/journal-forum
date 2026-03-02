const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostCommentLike = sequelize.define('PostCommentLike', {
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
    tableName: 'post_comment_likes',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            name: 'unique_post_comment_like',
            fields: ['comment_id', 'user_id']
        }
    ]
});

module.exports = PostCommentLike;
