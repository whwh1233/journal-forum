const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Favorite = sequelize.define('Favorite', {
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
    journalId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'journal_id'
    }
}, {
    tableName: 'online_favorites',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'journal_id']
        }
    ]
});

module.exports = Favorite;
