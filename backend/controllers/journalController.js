const { Journal } = require('../models');
const { Op } = require('sequelize');

// 获取所有期刊（支持搜索和筛选）
const getJournals = async (req, res, next) => {
    try {
        const { search, category, minRating, sortBy, page = 1, limit = 10 } = req.query;

        // 构建查询条件
        const where = {};

        if (search) {
            const searchTerm = `%${search}%`;
            where[Op.or] = [
                { title: { [Op.like]: searchTerm } },
                { issn: { [Op.like]: searchTerm } },
                { category: { [Op.like]: searchTerm } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (minRating) {
            where.rating = { [Op.gte]: Number(minRating) };
        }

        // 排序逻辑
        let order = [['created_at', 'DESC']];
        const dimensionFields = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];

        if (sortBy === 'rating') {
            order = [['rating', 'DESC']];
        }
        // 维度排序需要在内存中处理（JSON 字段无法直接 ORDER BY）

        const offset = (page - 1) * limit;
        const { count, rows } = await Journal.findAndCountAll({
            where,
            order,
            offset: Number(offset),
            limit: Number(limit)
        });

        let journals = rows.map(j => j.toJSON());

        // 如果按维度排序，需要在内存中重排（因为 JSON 字段排序 MySQL 较复杂）
        if (sortBy && dimensionFields.includes(sortBy)) {
            // 需要获取所有数据重排
            const allJournals = await Journal.findAll({ where });
            const allData = allJournals.map(j => j.toJSON());
            allData.sort((a, b) =>
                ((b.dimensionAverages && b.dimensionAverages[sortBy]) || 0) -
                ((a.dimensionAverages && a.dimensionAverages[sortBy]) || 0)
            );
            const sliced = allData.slice(Number(offset), Number(offset) + Number(limit));
            journals = sliced;
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

// 获取单个期刊详情
const getJournalById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const journal = await Journal.findByPk(Number(id));

        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        res.status(200).json({
            success: true,
            data: { journal }
        });
    } catch (error) {
        next(error);
    }
};

// 添加期刊评论（旧版：嵌入 reviews 数组）
const addJournalReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { author, rating, content } = req.body;

        if (!author || !rating || !content) {
            return res.status(400).json({
                success: false,
                message: '评论作者、评分和内容都是必填项'
            });
        }

        const journal = await Journal.findByPk(Number(id));
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        const reviews = journal.reviews || [];
        const newReview = {
            author,
            rating: Number(rating),
            content,
            createdAt: new Date().toISOString()
        };
        reviews.push(newReview);

        // 更新平均评分
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = Math.round((totalRating / reviews.length) * 10) / 10;

        await journal.update({ reviews, rating: newRating });

        res.status(201).json({
            success: true,
            data: { journal: journal.toJSON() }
        });
    } catch (error) {
        next(error);
    }
};

// 创建期刊（管理员功能）
const createJournal = async (req, res, next) => {
    try {
        const { title, issn, category, description } = req.body;

        if (!title || !issn || !category) {
            return res.status(400).json({
                success: false,
                message: '期刊名称、ISSN和分类是必填项'
            });
        }

        // 检查ISSN是否已存在
        const existing = await Journal.findOne({ where: { issn } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: '该ISSN已存在'
            });
        }

        const newJournal = await Journal.create({
            title,
            issn,
            category,
            description: description || '',
            rating: 0,
            reviews: []
        });

        res.status(201).json({
            success: true,
            data: { journal: newJournal }
        });
    } catch (error) {
        next(error);
    }
};

// 更新期刊（管理员功能）
const updateJournal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, issn, category, description } = req.body;

        const journal = await Journal.findByPk(Number(id));
        if (!journal) {
            return res.status(404).json({
                success: false,
                message: '期刊未找到'
            });
        }

        // 如果修改了ISSN，检查是否与其他期刊冲突
        if (issn && issn !== journal.issn) {
            const existing = await Journal.findOne({
                where: { issn, id: { [Op.ne]: Number(id) } }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: '该ISSN已存在'
                });
            }
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (issn) updateData.issn = issn;
        if (category) updateData.category = category;
        if (description !== undefined) updateData.description = description;

        await journal.update(updateData);

        res.status(200).json({
            success: true,
            data: { journal }
        });
    } catch (error) {
        next(error);
    }
};

// 删除期刊（管理员功能）
const deleteJournal = async (req, res, next) => {
    try {
        const { id } = req.params;

        const journal = await Journal.findByPk(Number(id));
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

module.exports = { getJournals, getJournalById, addJournalReview, createJournal, updateJournal, deleteJournal };
