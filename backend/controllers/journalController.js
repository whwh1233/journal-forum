const { Journal, JournalLevel, JournalRatingCache, Category, JournalCategoryMap, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取所有期刊（支持搜索和筛选）
const getJournals = async (req, res, next) => {
    try {
        const { search, level, categoryId, minRating, sortBy, page = 1, limit = 10 } = req.query;

        // 构建查询条件
        const where = {};
        const andConditions = [];

        if (search) {
            const searchTerm = `%${search}%`;
            where[Op.or] = [
                { name: { [Op.like]: searchTerm } },
                { issn: { [Op.like]: searchTerm } },
                { cn: { [Op.like]: searchTerm } }
            ];
        }

        // 按等级筛选 (使用 EXISTS 子查询)
        if (level) {
            andConditions.push(sequelize.literal(`EXISTS (
                SELECT 1 FROM online_journal_levels l
                WHERE l.journal_id = Journal.journal_id
                AND l.level_name = ${sequelize.escape(level)}
            )`));
        }

        // 按分类筛选
        if (categoryId) {
            const category = await Category.findByPk(categoryId);
            if (category) {
                let categoryIds = [Number(categoryId)];
                if (category.level === 1) {
                    // 一级分类：获取所有子类ID
                    const children = await Category.findAll({
                        where: { parentId: categoryId },
                        attributes: ['id'],
                        raw: true
                    });
                    categoryIds = children.map(c => c.id);
                }
                if (categoryIds.length > 0) {
                    andConditions.push(sequelize.literal(`EXISTS (
                        SELECT 1 FROM online_journal_category_map m
                        WHERE m.journal_id = Journal.journal_id
                        AND m.category_id IN (${categoryIds.join(',')})
                    )`));
                }
            }
        }

        if (andConditions.length > 0) {
            where[Op.and] = andConditions;
        }

        // 排序逻辑
        let order = [];
        const dimensionFields = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];
        let sortInMemory = false;

        if (sortBy === 'rating') {
            // 按评分缓存表排序需要 JOIN
            sortInMemory = true;
        } else if (dimensionFields.includes(sortBy)) {
            sortInMemory = true;
        } else {
            order = [['name', 'ASC']];
        }

        const offset = (page - 1) * limit;

        // 基础查询，include 关联
        const queryOptions = {
            where,
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' }
            ],
            order,
            distinct: true
        };

        if (!sortInMemory) {
            queryOptions.offset = Number(offset);
            queryOptions.limit = Number(limit);
        }

        const { count, rows } = await Journal.findAndCountAll(queryOptions);

        let journals = rows.map(j => {
            const data = j.toJSON();
            // 将 levels 数组转换为 levelName 字符串数组
            data.levels = data.levels ? data.levels.map(l => l.levelName) : [];
            return data;
        });

        // 如果需要内存排序（按评分或维度排序）
        if (sortInMemory) {
            if (sortBy === 'rating') {
                journals.sort((a, b) =>
                    ((b.ratingCache && b.ratingCache.rating) || 0) -
                    ((a.ratingCache && a.ratingCache.rating) || 0)
                );
            } else if (dimensionFields.includes(sortBy)) {
                journals.sort((a, b) =>
                    ((b.ratingCache && b.ratingCache[sortBy]) || 0) -
                    ((a.ratingCache && a.ratingCache[sortBy]) || 0)
                );
            }
            // 分页
            journals = journals.slice(Number(offset), Number(offset) + Number(limit));
        }

        // 按最低评分筛选
        if (minRating) {
            journals = journals.filter(j =>
                j.ratingCache && j.ratingCache.rating >= Number(minRating)
            );
        }

        res.status(200).json({
            success: true,
            data: {
                journals,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: Number(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// 获取等级列表（用于筛选下拉框）
const getLevels = async (req, res, next) => {
    try {
        const levels = await JournalLevel.findAll({
            attributes: [
                'levelName',
                [sequelize.fn('COUNT', sequelize.col('journal_id')), 'count']
            ],
            group: ['levelName'],
            order: [[sequelize.fn('COUNT', sequelize.col('journal_id')), 'DESC']],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                levels: levels.map(l => ({
                    name: l.levelName,
                    count: parseInt(l.count)
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// 获取分类列表（树形结构）
const getCategories = async (req, res, next) => {
    try {
        // 获取一级分类
        const parentCategories = await Category.findAll({
            where: { level: 1 },
            attributes: ['id', 'name'],
            order: [['id', 'ASC']],
            raw: true
        });

        // 获取所有二级分类及其期刊数量
        const childCategories = await Category.findAll({
            where: { level: 2 },
            attributes: [
                'id',
                'name',
                'parentId',
                [sequelize.literal(`(
                    SELECT COUNT(*) FROM online_journal_category_map m
                    WHERE m.category_id = Category.id
                )`), 'journalCount']
            ],
            order: [['id', 'ASC']],
            raw: true
        });

        // 组装树形结构
        const categories = parentCategories.map(parent => ({
            ...parent,
            children: childCategories
                .filter(child => child.parentId === parent.id)
                .map(child => ({
                    id: child.id,
                    name: child.name,
                    journalCount: parseInt(child.journalCount) || 0
                }))
        }));

        res.status(200).json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        next(error);
    }
};

// 搜索期刊（用于投稿追踪期刊选择器）
const searchJournals = async (req, res, next) => {
    try {
        const { q, level, page = 1, limit = 10 } = req.query;

        // 验证查询字符串长度
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters'
            });
        }

        // 构建查询条件
        const where = {
            [Op.or]: [
                { name: { [Op.like]: `%${q}%` } },
                { issn: { [Op.like]: `%${q}%` } },
                { cn: { [Op.like]: `%${q}%` } }
            ]
        };

        // 可选等级过滤
        if (level) {
            where[Op.and] = sequelize.literal(`EXISTS (
                SELECT 1 FROM online_journal_levels l
                WHERE l.journal_id = Journal.journal_id
                AND l.level_name = ${sequelize.escape(level)}
            )`);
        }

        // 计算分页
        const offset = (Number(page) - 1) * Number(limit);

        // 执行查询（获取 limit + 1 条记录以判断是否有更多数据）
        const journals = await Journal.findAll({
            where,
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' }
            ],
            limit: Number(limit) + 1,
            offset: Number(offset),
            order: [['name', 'ASC']]
        });

        // 判断是否有更多数据
        const hasMore = journals.length > Number(limit);
        const results = hasMore ? journals.slice(0, Number(limit)) : journals;

        res.status(200).json({
            success: true,
            data: {
                journals: results.map(j => {
                    const data = j.toJSON();
                    data.levels = data.levels ? data.levels.map(l => l.levelName) : [];
                    return data;
                }),
                hasMore
            }
        });
    } catch (error) {
        next(error);
    }
};

// 获取单个期刊详情
const getJournalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const journal = await Journal.findByPk(id, {
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' }
            ]
        });

        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        const data = journal.toJSON();
        data.levels = data.levels ? data.levels.map(l => l.levelName) : [];

        res.status(200).json({
            success: true,
            data: { journal: data }
        });
    } catch (error) {
        next(error);
    }
};

// 创建期刊（管理员功能）- 新结构暂不提供，期刊数据从外部导入
const createJournal = async (req, res, next) => {
    try {
        const { journalId, name, issn, cn, levels = [] } = req.body;

        if (!journalId || !name) {
            return res.status(400).json({
                success: false,
                message: '期刊ID和名称是必填项'
            });
        }

        // 检查 journalId 是否已存在
        const existing = await Journal.findByPk(journalId);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: '该期刊ID已存在'
            });
        }

        const newJournal = await Journal.create({
            journalId,
            name,
            issn,
            cn
        });

        // 创建等级关联
        if (levels.length > 0) {
            await JournalLevel.bulkCreate(
                levels.map(levelName => ({ journalId, levelName }))
            );
        }

        // 重新获取完整数据
        const journal = await Journal.findByPk(journalId, {
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] }
            ]
        });

        const data = journal.toJSON();
        data.levels = data.levels ? data.levels.map(l => l.levelName) : [];

        res.status(201).json({
            success: true,
            data: { journal: data }
        });
    } catch (error) {
        next(error);
    }
};

// 更新期刊（管理员功能）
const updateJournal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, issn, cn, levels } = req.body;

        const journal = await Journal.findByPk(id);
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (issn !== undefined) updateData.issn = issn;
        if (cn !== undefined) updateData.cn = cn;

        await journal.update(updateData);

        // 如果提供了新的等级列表，更新关联
        if (levels !== undefined) {
            await JournalLevel.destroy({ where: { journalId: id } });
            if (levels.length > 0) {
                await JournalLevel.bulkCreate(
                    levels.map(levelName => ({ journalId: id, levelName }))
                );
            }
        }

        // 重新获取完整数据
        const updatedJournal = await Journal.findByPk(id, {
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' }
            ]
        });

        const data = updatedJournal.toJSON();
        data.levels = data.levels ? data.levels.map(l => l.levelName) : [];

        res.status(200).json({
            success: true,
            data: { journal: data }
        });
    } catch (error) {
        next(error);
    }
};

// 删除期刊（管理员功能）
const deleteJournal = async (req, res, next) => {
    try {
        const { id } = req.params;

        const journal = await Journal.findByPk(id);
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        await journal.destroy();

        res.status(200).json({
            success: true,
            message: '期刊删除成功'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getJournals,
    getLevels,
    getCategories,
    searchJournals,
    getJournalById,
    createJournal,
    updateJournal,
    deleteJournal
};
