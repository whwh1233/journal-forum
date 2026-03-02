const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostComment = sequelize.define('PostComment', {
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
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: '评论内容是必填项' }
        }
    },
    likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    }
}, {
    tableName: 'post_comments',
    indexes: [
        { fields: ['post_id'] },
        { fields: ['user_id'] },
        { fields: ['parent_id'] }
    ]
});

module.exports = PostComment;
