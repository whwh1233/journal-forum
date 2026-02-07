const { Op } = require('sequelize');
const Journal = require('../models/JournalSequelize');

// 获取所有期刊（支持搜索和筛选）
const getJournals = async (req, res, next) => {
  try {
    const { search, category, minRating, page = 1, limit = 10 } = req.query;

    // 构建查询条件
    const where = {};

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      where[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { issn: { [Op.like]: `%${searchTerm}%` } },
        { category: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    // 学科筛选
    if (category) {
      where.category = category;
    }

    // 评分筛选
    if (minRating) {
      where.rating = { [Op.gte]: Number(minRating) };
    }

    // 分页设置
    const offset = (page - 1) * limit;

    // 查询数据库
    const { count, rows } = await Journal.findAndCountAll({
      where,
      limit: Number(limit),
      offset: offset,
      order: [['createdAt', 'DESC']] // 按创建时间降序
    });

    res.status(200).json({
      success: true,
      data: {
        journals: rows,
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
    const journal = await Journal.findByPk(id);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: '期刊未找到'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        journal
      }
    });
  } catch (error) {
    next(error);
  }
};

// 添加期刊评论
const addJournalReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { author, rating, content } = req.body;

    // 验证输入
    if (!author || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: '评论作者、评分和内容都是必填项'
      });
    }

    const journal = await Journal.findByPk(id);
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: '期刊未找到'
      });
    }

    // 使用模型的addReview方法
    await journal.addReview(author, Number(rating), content);

    // 重新获取更新后的期刊数据
    await journal.reload();

    res.status(201).json({
      success: true,
      data: {
        journal
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJournals, getJournalById, addJournalReview };
