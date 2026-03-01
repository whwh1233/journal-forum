const { getDB } = require('../config/databaseLowdb');

// 获取所有期刊（支持搜索和筛选）
const getJournals = async (req, res, next) => {
  try {
    const { search, category, minRating, sortBy, page = 1, limit = 10 } = req.query;
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

    // 排序
    const dimensionFields = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];
    if (sortBy === 'rating') {
      journalList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy && dimensionFields.includes(sortBy)) {
      journalList.sort((a, b) =>
        ((b.dimensionAverages && b.dimensionAverages[sortBy]) || 0) -
        ((a.dimensionAverages && a.dimensionAverages[sortBy]) || 0)
      );
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

// 创建期刊（管理员功能）
const createJournal = async (req, res, next) => {
  try {
    const { title, issn, category, description } = req.body;
    const db = getDB();

    // 验证输入
    if (!title || !issn || !category) {
      return res.status(400).json({
        success: false,
        message: '期刊名称、ISSN和分类是必填项'
      });
    }

    // 检查ISSN是否已存在
    const existingJournal = db.data.journals.find(j => j.issn === issn);
    if (existingJournal) {
      return res.status(400).json({
        success: false,
        message: '该ISSN已存在'
      });
    }

    // 创建新期刊
    const newJournal = {
      id: db.data.journals.length > 0
        ? Math.max(...db.data.journals.map(j => j.id)) + 1
        : 1,
      title,
      issn,
      category,
      description: description || '',
      rating: 0,
      reviews: [],
      createdAt: new Date().toISOString()
    };

    db.data.journals.push(newJournal);
    await db.write();

    res.status(201).json({
      success: true,
      data: {
        journal: newJournal
      }
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
    const db = getDB();

    const journalIndex = db.data.journals.findIndex(j => j.id === Number(id));
    if (journalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '期刊未找到'
      });
    }

    // 如果修改了ISSN，检查是否与其他期刊冲突
    if (issn && issn !== db.data.journals[journalIndex].issn) {
      const existingJournal = db.data.journals.find(j => j.issn === issn && j.id !== Number(id));
      if (existingJournal) {
        return res.status(400).json({
          success: false,
          message: '该ISSN已存在'
        });
      }
    }

    // 更新期刊信息
    if (title) db.data.journals[journalIndex].title = title;
    if (issn) db.data.journals[journalIndex].issn = issn;
    if (category) db.data.journals[journalIndex].category = category;
    if (description !== undefined) db.data.journals[journalIndex].description = description;

    await db.write();

    res.status(200).json({
      success: true,
      data: {
        journal: db.data.journals[journalIndex]
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除期刊（管理员功能）
const deleteJournal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const journalIndex = db.data.journals.findIndex(j => j.id === Number(id));
    if (journalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '期刊未找到'
      });
    }

    db.data.journals.splice(journalIndex, 1);
    await db.write();

    res.status(200).json({
      success: true,
      message: '期刊删除成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJournals, getJournalById, addJournalReview, createJournal, updateJournal, deleteJournal };
