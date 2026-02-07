const { getDB } = require('../config/databaseLowdb');

// 获取所有期刊（支持搜索和筛选）
const getJournals = async (req, res, next) => {
  try {
    const { search, category, minRating, page = 1, limit = 10 } = req.query;
    const db = getDB();

    // 获取所有期刊
    let journalList = [...db.data.journals];

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      journalList = journalList.filter(journal =>
        journal.title.toLowerCase().includes(searchTerm) ||
        journal.issn.toLowerCase().includes(searchTerm) ||
        journal.category.toLowerCase().includes(searchTerm)
      );
    }

    // 学科筛选
    if (category) {
      journalList = journalList.filter(journal => journal.category === category);
    }

    // 评分筛选
    if (minRating) {
      journalList = journalList.filter(journal => journal.rating >= Number(minRating));
    }

    // 分页设置
    const skip = (page - 1) * limit;
    const total = journalList.length;
    const paginatedJournals = journalList.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        journals: paginatedJournals,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
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
    const db = getDB();

    const journal = db.data.journals.find(j => j.id === Number(id));

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
    const db = getDB();

    // 验证输入
    if (!author || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: '评论作者、评分和内容都是必填项'
      });
    }

    const journal = db.data.journals.find(j => j.id === Number(id));
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: '期刊未找到'
      });
    }

    // 添加评论
    const newReview = {
      author,
      rating: Number(rating),
      content,
      createdAt: new Date().toISOString()
    };

    journal.reviews.push(newReview);

    // 更新平均评分
    const totalRating = journal.reviews.reduce((sum, review) => sum + review.rating, 0);
    journal.rating = Math.round((totalRating / journal.reviews.length) * 10) / 10;

    // 保存到文件
    await db.write();

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
