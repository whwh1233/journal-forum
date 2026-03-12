const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.CHAR(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_time',
        comment: '发布/生效时间，空则立即生效'
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time',
        comment: '下线/过期时间，空则永久有效'
    },
    type: {
        type: DataTypes.ENUM('normal', 'urgent', 'banner'),
        defaultValue: 'normal',
        field: 'type',
        comment: '公告类型：normal=普通通知，urgent=紧急弹窗，banner=顶部横幅'
    },
    status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'active', 'expired', 'archived'),
        defaultValue: 'draft',
        field: 'status',
        comment: '公告状态：draft=草稿，scheduled=定时发布，active=生效中，expired=已过期，archived=已归档'
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'priority',
        comment: '优先级，数值越大越靠前'
    },
    targetType: {
        type: DataTypes.ENUM('all', 'role', 'user'),
        defaultValue: 'all',
        field: 'target_type',
        comment: '目标受众类型：all=全体用户，role=按角色，user=指定用户'
    },
    targetRoles: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'target_roles',
        comment: '目标角色数组，如 ["admin","user"]'
    },
    targetUserIds: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'target_user_ids',
        comment: '目标用户ID数组'
    },
    colorScheme: {
        type: DataTypes.STRING(50),
        defaultValue: 'info',
        field: 'color_scheme',
        comment: '预设配色方案：info/success/warning/error'
    },
    customColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        field: 'custom_color',
        comment: '自定义主题色，HEX格式如 #FF5733'
    },
    isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_pinned',
        comment: '是否置顶显示'
    },
    creatorId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'creator_id',
        comment: '发布管理员的ID'
    }
}, {
    tableName: 'announcements',
    timestamps: true
});

module.exports = Announcement;
