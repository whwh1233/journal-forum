const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubmissionStatusHistory = sequelize.define('SubmissionStatusHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    submissionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'submission_id'
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'online_submission_status_history',
    indexes: [
        { fields: ['submission_id'] },
        { fields: ['date'] }
    ]
});

module.exports = SubmissionStatusHistory;
