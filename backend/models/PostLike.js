const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostLike = sequelize.define('PostLike', {
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
    }
}, {
    tableName: 'post_likes',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            name: 'unique_post_like',
            fields: ['post_id', 'user_id']
        }
    ]
});

module.exports = PostLike;
