const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Manuscript = sequelize.define('Manuscript', {
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
    title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: { msg: '稿件标题是必填项' },
            len: { args: [1, 500], msg: '标题长度必须在1-500字符之间' }
        }
    },
    currentStatus: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'drafting',
        field: 'current_status'
    }
}, {
    tableName: 'manuscripts',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['created_at'] }
    ]
});

module.exports = Manuscript;
