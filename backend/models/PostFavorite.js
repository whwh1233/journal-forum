const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostFavorite = sequelize.define('PostFavorite', {
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
    tableName: 'post_favorites',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            name: 'unique_post_favorite',
            fields: ['post_id', 'user_id']
        }
    ]
});

module.exports = PostFavorite;
