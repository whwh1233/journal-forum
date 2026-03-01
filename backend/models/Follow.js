const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Follow = sequelize.define('Follow', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    followerId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'follower_id'
    },
    followingId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'following_id'
    }
}, {
    tableName: 'follows',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['follower_id', 'following_id']
        }
    ]
});

module.exports = Follow;
