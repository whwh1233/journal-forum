const { Journal, JournalLevel, JournalRatingCache, Category, JournalCategoryMap, sequelize } = require('../models');
const { Op } = require('sequelize');

// 排序字段优先级顺序（固定）
const SORT_FIELD_PRIORITY = [
    'commentCount',      // 评论数
    'impactFactor',      // 影响因子
    'rating',            // 综合评分
    'overallExperience', // 综合体验
    'reviewSpeed',       // 审稿速度
    'editorAttitude',    // 编辑态度
    'acceptDifficulty',  // 录用难度
    'reviewQuality'      // 审稿质量
];

// 需要内存排序的字段（来自 ratingCache）
const RATING_CACHE_FIELDS = ['commentCount', 'rating', 'overallExperience', 'reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality'];

// 解析排序参数：支持 field:order,field:order 格式
const parseSortBy = (sortBy) => {
    if (!sortBy) return [];

    const sortFields = [];
    const parts = sortBy.split(',');

    for (const part of parts) {
        const [field, order = 'desc'] = part.trim().split(':');
        if (field && SORT_FIELD_PRIORITY.includes(field)) {
            sortFields.push({
                field,
                order: order.toLowerCase() === 'asc' ? 'asc' : 'desc'
            });
        }
    }

    // 按固定优先级排序
    sortFields.sort((a, b) =>
        SORT_FIELD_PRIORITY.indexOf(a.field) - SORT_FIELD_PRIORITY.indexOf(b.field)
    );

    return sortFields;
};

// 获取字段值的辅助函数
const getFieldValue = (journal, field) => {
    if (field === 'impactFactor') {
        return journal.impactFactor || 0;
    }
    if (field === 'commentCount') {
        return (journal.ratingCache && journal.ratingCache.ratingCount) || 0;
    }
    // 其他字段都在 ratingCache 中
    return (journal.ratingCache && journal.ratingCache[field]) || 0;
};

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

        // 解析排序参数
        const sortFields = parseSortBy(sortBy);

        // 判断是否需要内存排序
        const needsMemorySort = sortFields.length > 0 &&
            sortFields.some(sf => RATING_CACHE_FIELDS.includes(sf.field));

        // 构建数据库排序（仅当不需要内存排序且有 impactFactor 排序时）
        let order = [];
        if (!needsMemorySort) {
            const ifSort = sortFields.find(sf => sf.field === 'impactFactor');
            if (ifSort) {
                // 处理 NULL 值：NULL 始终排最后
                order = [
                    [sequelize.fn('ISNULL', sequelize.col('impactFactor')), 'ASC'],
                    ['impactFactor', ifSort.order.toUpperCase()]
                ];
            } else if (sortFields.length === 0) {
                // 默认按影响因子降序，NULL 排最后
                order = [
                    [sequelize.fn('ISNULL', sequelize.col('impactFactor')), 'ASC'],
                    ['impactFactor', 'DESC']
                ];
            }
        }

        const offset = (page - 1) * limit;

        // 基础查询，include 关联
        const queryOptions = {
            where,
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' },
                { model: Category, as: 'categories', attributes: ['name'], through: { attributes: [] } }
            ],
            order,
            distinct: true
        };

        // 如果需要内存排序，先获取全部数据再分页
        if (!needsMemorySort) {
            queryOptions.offset = Number(offset);
            queryOptions.limit = Number(limit);
        }

        const { count, rows } = await Journal.findAndCountAll(queryOptions);

        let journals = rows.map(j => {
            const data = j.toJSON();
            // 将 levels 数组转换为 levelName 字符串数组
            data.levels = data.levels ? data.levels.map(l => l.levelName) : [];
            // 将 categories 数组格式化为 category 字符串
            data.category = data.categories ? data.categories.map(c => c.name).join(' / ') : '';
            return data;
        });

        // 内存排序（多字段排序）
        if (needsMemorySort && sortFields.length > 0) {
            journals.sort((a, b) => {
                for (const { field, order } of sortFields) {
                    const aVal = getFieldValue(a, field);
                    const bVal = getFieldValue(b, field);

                    if (aVal !== bVal) {
                        const diff = order === 'asc' ? aVal - bVal : bVal - aVal;
                        if (diff !== 0) return diff;
                    }
                }
                return 0;
            });
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
        const { q, level, categoryId, page = 1, limit = 10 } = req.query;

        // 验证查询字符串长度
        if (!q || q.trim().length < 1) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 1 character'
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

        const andConditions = [];

        // 可选等级过滤
        if (level) {
            andConditions.push(sequelize.literal(`EXISTS (
                SELECT 1 FROM online_journal_levels l
                WHERE l.journal_id = \`Journal\`.\`journal_id\`
                AND l.level_name = ${sequelize.escape(level)}
            )`));
        }

        // 可选学科分类过滤
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

        // 计算分页
        const offset = (Number(page) - 1) * Number(limit);

        // 执行查询（获取 limit + 1 条记录以判断是否有更多数据）
        const journals = await Journal.findAll({
            where,
            include: [
                { model: JournalLevel, as: 'levels', attributes: ['levelName'] },
                { model: JournalRatingCache, as: 'ratingCache' },
                { model: Category, as: 'categories', attributes: ['name'], through: { attributes: [] } }
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
                    data.category = data.categories ? data.categories.map(c => c.name).join(' / ') : '';
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
                { model: JournalRatingCache, as: 'ratingCache' },
                { model: Category, as: 'categories', attributes: ['name'], through: { attributes: [] } }
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
        data.category = data.categories ? data.categories.map(c => c.name).join(' / ') : '';

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
