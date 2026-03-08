const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
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
    manuscriptId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'manuscript_id'
    },
    journalId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'journal_id'
    },
    journalName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'journal_name'
    },
    submissionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'submission_date'
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'submitted'
    }
}, {
    tableName: 'online_submissions',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['manuscript_id'] },
        { fields: ['journal_id'] }
    ]
});

module.exports = Submission;
