const { Announcement, UserAnnouncementRead, User } = require('../models');
const { Op } = require('sequelize');

// ==================== 辅助函数 ====================

/**
 * 同步过期状态（check-on-read 模式）
 * 1. scheduled → active (startTime 已到)
 * 2. active → expired (endTime 已到)
 */
const syncStaleStatuses = async () => {
    const now = new Date();

    // scheduled → active
    await Announcement.update(
        { status: 'active' },
        {
            where: {
                status: 'scheduled',
                startTime: { [Op.lte]: now }
            }
        }
    );

    // active → expired
    await Announcement.update(
        { status: 'expired' },
        {
            where: {
                status: 'active',
                endTime: { [Op.not]: null, [Op.lte]: now }
            }
        }
    );
};

/**
 * 检查公告对用户是否可见
 */
const isVisibleToUser = (announcement, user) => {
    if (announcement.targetType === 'all') {
        return true;
    }

    if (announcement.targetType === 'role') {
        const targetRoles = announcement.targetRoles || [];
        return targetRoles.includes(user.role);
    }

    if (announcement.targetType === 'user') {
        const targetUserIds = announcement.targetUserIds || [];
        return targetUserIds.includes(user.id);
    }

    return false;
};

// ==================== 公开接口 ====================

/**
 * 获取横幅公告（无需认证）
 * GET /api/announcements/banners
 */
const getBanners = async (req, res) => {
    try {
        const now = new Date();

        const banners = await Announcement.findAll({
            where: {
                type: 'banner',
                status: 'active',
                targetType: 'all',
                [Op.and]: [
                    {
                        [Op.or]: [
                            { startTime: null },
                            { startTime: { [Op.lte]: now } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { endTime: null },
                            { endTime: { [Op.gt]: now } }
                        ]
                    }
                ]
            },
            order: [
                ['priority', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Error getting banners:', error);
        res.status(500).json({ success: false, message: '获取横幅公告失败' });
    }
};

/**
 * 获取用户可见的公告列表（需认证）
 * GET /api/announcements?page=1&limit=20
 */
const getAnnouncements = async (req, res) => {
    try {
        await syncStaleStatuses();

        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const now = new Date();

        // 构建基础查询条件
        const whereConditions = {
            status: 'active',
            [Op.or]: [
                { startTime: null },
                { startTime: { [Op.lte]: now } }
            ],
            [Op.and]: [
                {
                    [Op.or]: [
                        { endTime: null },
                        { endTime: { [Op.gt]: now } }
                    ]
                }
            ]
        };

        // 获取所有可能可见的公告
        const allAnnouncements = await Announcement.findAll({
            where: whereConditions,
            include: [
                {
                    model: UserAnnouncementRead,
                    as: 'UserAnnouncementReads',
                    where: { userId },
                    required: false,
                    attributes: ['readAt', 'dismissed']
                }
            ],
            order: [
                ['isPinned', 'DESC'],
                ['priority', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        // 过滤出对当前用户可见的公告
        const visibleAnnouncements = allAnnouncements.filter(announcement =>
            isVisibleToUser(announcement, req.user)
        );

        // 分页
        const total = visibleAnnouncements.length;
        const paginatedAnnouncements = visibleAnnouncements.slice(offset, offset + limit);

        // 格式化响应数据
        const formattedAnnouncements = paginatedAnnouncements.map(announcement => {
            const readRecord = announcement.UserAnnouncementReads?.[0];
            return {
                ...announcement.toJSON(),
                isRead: !!readRecord,
                readAt: readRecord?.readAt || null,
                dismissed: readRecord?.dismissed || false,
                UserAnnouncementReads: undefined
            };
        });

        res.json({
            success: true,
            data: {
                announcements: formattedAnnouncements,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting announcements:', error);
        res.status(500).json({ success: false, message: '获取公告列表失败' });
    }
};

/**
 * 获取未读公告数量（需认证）
 * GET /api/announcements/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // 获取所有活跃公告
        const allAnnouncements = await Announcement.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    { startTime: null },
                    { startTime: { [Op.lte]: now } }
                ],
                [Op.and]: [
                    {
                        [Op.or]: [
                            { endTime: null },
                            { endTime: { [Op.gt]: now } }
                        ]
                    }
                ]
            }
        });

        // 过滤出对当前用户可见的公告
        const visibleAnnouncements = allAnnouncements.filter(announcement =>
            isVisibleToUser(announcement, req.user)
        );

        // 获取已读记录
        const readRecords = await UserAnnouncementRead.findAll({
            where: {
                userId,
                announcementId: { [Op.in]: visibleAnnouncements.map(a => a.id) }
            },
            attributes: ['announcementId']
        });

        const readIds = new Set(readRecords.map(r => r.announcementId));
        const unreadCount = visibleAnnouncements.filter(a => !readIds.has(a.id)).length;

        res.json({ success: true, data: { count: unreadCount } });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: '获取未读数量失败' });
    }
};

/**
 * 获取单个公告详情（需认证，自动标记为已读）
 * GET /api/announcements/:id
 */
const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        // 检查可见性
        if (!isVisibleToUser(announcement, req.user)) {
            return res.status(403).json({ success: false, message: '无权查看此公告' });
        }

        // 自动标记为已读
        await UserAnnouncementRead.findOrCreate({
            where: { userId, announcementId: id },
            defaults: { userId, announcementId: id, readAt: new Date() }
        });

        res.json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error getting announcement by id:', error);
        res.status(500).json({ success: false, message: '获取公告详情失败' });
    }
};

/**
 * 标记公告为已读（需认证）
 * POST /api/announcements/:id/read
 * Body: { dismissed?: boolean }
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { dismissed } = req.body;

        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        // 检查可见性
        if (!isVisibleToUser(announcement, req.user)) {
            return res.status(403).json({ success: false, message: '无权访问此公告' });
        }

        const [readRecord] = await UserAnnouncementRead.findOrCreate({
            where: { userId, announcementId: id },
            defaults: {
                userId,
                announcementId: id,
                readAt: new Date(),
                dismissed: dismissed === true
            }
        });

        // 如果记录已存在，更新 dismissed 状态
        if (dismissed === true && !readRecord.dismissed) {
            await readRecord.update({ dismissed: true });
        }

        res.json({ success: true, message: '标记成功' });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ success: false, message: '标记失败' });
    }
};

/**
 * 标记所有公告为已读（需认证）
 * POST /api/announcements/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // 获取所有活跃且可见的公告
        const allAnnouncements = await Announcement.findAll({
            where: {
                status: 'active',
                [Op.or]: [
                    { startTime: null },
                    { startTime: { [Op.lte]: now } }
                ],
                [Op.and]: [
                    {
                        [Op.or]: [
                            { endTime: null },
                            { endTime: { [Op.gt]: now } }
                        ]
                    }
                ]
            }
        });

        const visibleAnnouncements = allAnnouncements.filter(announcement =>
            isVisibleToUser(announcement, req.user)
        );

        // 获取已读记录
        const readRecords = await UserAnnouncementRead.findAll({
            where: {
                userId,
                announcementId: { [Op.in]: visibleAnnouncements.map(a => a.id) }
            }
        });

        const readIds = new Set(readRecords.map(r => r.announcementId));
        const unreadAnnouncements = visibleAnnouncements.filter(a => !readIds.has(a.id));

        // 批量创建已读记录
        if (unreadAnnouncements.length > 0) {
            await UserAnnouncementRead.bulkCreate(
                unreadAnnouncements.map(a => ({
                    userId,
                    announcementId: a.id,
                    readAt: now
                }))
            );
        }

        res.json({ success: true, message: '全部标记为已读' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: '批量标记失败' });
    }
};

// ==================== 管理员接口 ====================

/**
 * 管理员获取公告列表（带筛选、排序、分页）
 * GET /api/admin/announcements?status=active&type=normal&sortBy=createdAt&order=desc&page=1&limit=20
 */
const adminGetAnnouncements = async (req, res) => {
    try {
        await syncStaleStatuses();

        const { status, type, sortBy = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;

        const { count, rows: announcements } = await Announcement.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [[sortBy, order.toUpperCase()]],
            limit: parseInt(limit),
            offset
        });

        // 计算每个公告的阅读统计
        const announcementsWithStats = await Promise.all(
            announcements.map(async (announcement) => {
                const readCount = await UserAnnouncementRead.count({
                    where: { announcementId: announcement.id }
                });

                // 计算目标受众总数
                let targetAudienceSize = 0;
                if (announcement.targetType === 'all') {
                    targetAudienceSize = await User.count();
                } else if (announcement.targetType === 'role') {
                    const targetRoles = announcement.targetRoles || [];
                    targetAudienceSize = await User.count({
                        where: { role: { [Op.in]: targetRoles } }
                    });
                } else if (announcement.targetType === 'user') {
                    targetAudienceSize = (announcement.targetUserIds || []).length;
                }

                const readPercentage = targetAudienceSize > 0
                    ? Math.round((readCount / targetAudienceSize) * 100)
                    : 0;

                return {
                    ...announcement.toJSON(),
                    creatorName: announcement.creator?.name || announcement.creator?.email || '未知',
                    readCount,
                    readPercentage
                };
            })
        );

        res.json({
            success: true,
            data: {
                announcements: announcementsWithStats,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error admin getting announcements:', error);
        res.status(500).json({ success: false, message: '获取公告列表失败' });
    }
};

/**
 * 管理员获取单个公告详情（含统计）
 * GET /api/admin/announcements/:id
 */
const adminGetAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        // 计算阅读统计
        const readCount = await UserAnnouncementRead.count({
            where: { announcementId: id }
        });

        let targetAudienceSize = 0;
        if (announcement.targetType === 'all') {
            targetAudienceSize = await User.count();
        } else if (announcement.targetType === 'role') {
            const targetRoles = announcement.targetRoles || [];
            targetAudienceSize = await User.count({
                where: { role: { [Op.in]: targetRoles } }
            });
        } else if (announcement.targetType === 'user') {
            targetAudienceSize = (announcement.targetUserIds || []).length;
        }

        const readPercentage = targetAudienceSize > 0
            ? Math.round((readCount / targetAudienceSize) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                ...announcement.toJSON(),
                creatorName: announcement.creator?.name || announcement.creator?.email || '未知',
                readCount,
                targetAudienceSize,
                readPercentage
            }
        });
    } catch (error) {
        console.error('Error admin getting announcement by id:', error);
        res.status(500).json({ success: false, message: '获取公告详情失败' });
    }
};

/**
 * 管理员创建公告
 * POST /api/admin/announcements
 */
const adminCreateAnnouncement = async (req, res) => {
    try {
        const {
            title,
            content,
            type,
            targetType,
            targetRoles,
            targetUserIds,
            colorScheme,
            customColor,
            isPinned,
            priority,
            startTime,
            endTime
        } = req.body;

        // 验证必填字段
        if (!title || !content || !type) {
            return res.status(400).json({
                success: false,
                message: '标题、内容和类型为必填项'
            });
        }

        // 确定初始状态
        let status = 'draft';
        if (startTime) {
            const start = new Date(startTime);
            if (start > new Date()) {
                status = 'scheduled';
            }
        }

        const announcement = await Announcement.create({
            title,
            content,
            type,
            status,
            targetType: targetType || 'all',
            targetRoles: targetRoles || null,
            targetUserIds: targetUserIds || null,
            colorScheme: colorScheme || 'info',
            customColor: customColor || null,
            isPinned: isPinned || false,
            priority: priority || 0,
            startTime: startTime || null,
            endTime: endTime || null,
            creatorId: req.user.id
        });

        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error admin creating announcement:', error);
        res.status(500).json({ success: false, message: '创建公告失败' });
    }
};

/**
 * 管理员更新公告
 * PUT /api/admin/announcements/:id
 */
const adminUpdateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        if (announcement.status === 'archived') {
            return res.status(400).json({ success: false, message: '已归档的公告不可编辑' });
        }

        const {
            title,
            content,
            type,
            targetType,
            targetRoles,
            targetUserIds,
            colorScheme,
            customColor,
            isPinned,
            priority,
            startTime,
            endTime
        } = req.body;

        await announcement.update({
            title: title !== undefined ? title : announcement.title,
            content: content !== undefined ? content : announcement.content,
            type: type !== undefined ? type : announcement.type,
            targetType: targetType !== undefined ? targetType : announcement.targetType,
            targetRoles: targetRoles !== undefined ? targetRoles : announcement.targetRoles,
            targetUserIds: targetUserIds !== undefined ? targetUserIds : announcement.targetUserIds,
            colorScheme: colorScheme !== undefined ? colorScheme : announcement.colorScheme,
            customColor: customColor !== undefined ? customColor : announcement.customColor,
            isPinned: isPinned !== undefined ? isPinned : announcement.isPinned,
            priority: priority !== undefined ? priority : announcement.priority,
            startTime: startTime !== undefined ? startTime : announcement.startTime,
            endTime: endTime !== undefined ? endTime : announcement.endTime
        });

        res.json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error admin updating announcement:', error);
        res.status(500).json({ success: false, message: '更新公告失败' });
    }
};

/**
 * 管理员发布公告
 * PUT /api/admin/announcements/:id/publish
 */
const adminPublishAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        if (announcement.status !== 'draft') {
            return res.status(400).json({ success: false, message: '只能发布草稿状态的公告' });
        }

        // 判断是立即生效还是定时发布
        let newStatus = 'active';
        if (announcement.startTime && new Date(announcement.startTime) > new Date()) {
            newStatus = 'scheduled';
        }

        await announcement.update({ status: newStatus });

        res.json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error admin publishing announcement:', error);
        res.status(500).json({ success: false, message: '发布公告失败' });
    }
};

/**
 * 管理员归档公告
 * PUT /api/admin/announcements/:id/archive
 */
const adminArchiveAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        if (announcement.status !== 'active') {
            return res.status(400).json({ success: false, message: '只能归档生效中的公告' });
        }

        await announcement.update({ status: 'archived' });

        res.json({ success: true, data: announcement });
    } catch (error) {
        console.error('Error admin archiving announcement:', error);
        res.status(500).json({ success: false, message: '归档公告失败' });
    }
};

/**
 * 管理员删除公告
 * DELETE /api/admin/announcements/:id
 */
const adminDeleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: '公告不存在' });
        }

        const allowedStatuses = ['draft', 'expired', 'archived'];
        if (!allowedStatuses.includes(announcement.status)) {
            return res.status(400).json({
                success: false,
                message: '只能删除草稿、已过期或已归档的公告'
            });
        }

        await announcement.destroy();

        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('Error admin deleting announcement:', error);
        res.status(500).json({ success: false, message: '删除公告失败' });
    }
};

module.exports = {
    // 公开接口
    getBanners,
    // 用户接口
    getAnnouncements,
    getUnreadCount,
    getAnnouncementById,
    markAsRead,
    markAllAsRead,
    // 管理员接口
    adminGetAnnouncements,
    adminGetAnnouncementById,
    adminCreateAnnouncement,
    adminUpdateAnnouncement,
    adminPublishAnnouncement,
    adminArchiveAnnouncement,
    adminDeleteAnnouncement
};
