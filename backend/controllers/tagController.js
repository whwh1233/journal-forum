const { Tag, User, PostTagMap, PostCategory, Post, SystemConfig, sequelize } = require('../models');
const { Op } = require('sequelize');

// ==================== 公开接口 ====================

// 获取已审核标签（支持搜索、排序、分页）
const getTags = async (req, res) => {
  try {
    const { search, sort = 'postCount', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'approved' };
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    let order;
    switch (sort) {
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'postCount':
      default:
        order = [['postCount', 'DESC']];
        break;
    }

    const { count, rows: tags } = await Tag.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset
    });

    res.json({
      tags,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
};

// 获取热门标签
const getHotTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { status: 'approved' },
      order: [['postCount', 'DESC']],
      limit: 20
    });
    res.json({ tags });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(500).json({ error: '获取热门标签失败' });
  }
};

// 标签建议（需登录）
const suggestTags = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    let tags;
    if (q && q.trim()) {
      const normalized = q.trim().toLowerCase();
      // 前缀匹配：已审核的 + 用户自己创建的待审核标签
      tags = await Tag.findAll({
        where: {
          normalizedName: { [Op.like]: `${normalized}%` },
          [Op.or]: [
            { status: 'approved' },
            { status: 'pending', createdBy: userId }
          ]
        },
        order: [
          ['isOfficial', 'DESC'],
          ['postCount', 'DESC']
        ],
        limit: 10
      });
    } else {
      // 空查询：返回热门标签 + 用户待审核标签
      const hotTags = await Tag.findAll({
        where: { status: 'approved' },
        order: [['postCount', 'DESC']],
        limit: 10
      });

      const pendingTags = await Tag.findAll({
        where: { status: 'pending', createdBy: userId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // 合并，官方标签优先，去重后限制10个
      const seen = new Set();
      tags = [];
      for (const tag of [...hotTags, ...pendingTags]) {
        if (!seen.has(tag.id) && tags.length < 10) {
          seen.add(tag.id);
          tags.push(tag);
        }
      }
    }

    res.json({ tags });
  } catch (error) {
    console.error('获取标签建议失败:', error);
    res.status(500).json({ error: '获取标签建议失败' });
  }
};

// 创建标签（需登录）
const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const normalizedName = name.trim().toLowerCase();

    // 检查是否已存在
    const existing = await Tag.findOne({ where: { normalizedName } });
    if (existing) {
      return res.json({ tag: existing, isNew: false });
    }

    // 创建为待审核
    try {
      const tag = await Tag.create({
        name: name.trim(),
        normalizedName,
        status: 'pending',
        createdBy: req.user.id
      });
      return res.status(201).json({ tag, isNew: true });
    } catch (err) {
      // UNIQUE 约束竞态条件处理
      if (err.name === 'SequelizeUniqueConstraintError') {
        const existing = await Tag.findOne({ where: { normalizedName } });
        return res.json({ tag: existing, isNew: false });
      }
      throw err;
    }
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({ error: '创建标签失败' });
  }
};

// ==================== 管理员接口 ====================

// 管理员：获取所有标签（含待审核）
const adminGetTags = async (req, res) => {
  try {
    const { status, isOfficial, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (isOfficial !== undefined) where.isOfficial = isOfficial === 'true';
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: tags } = await Tag.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      tags,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('管理员获取标签失败:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
};

// 管理员：创建官方标签
const adminCreateTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const normalizedName = name.trim().toLowerCase();

    const existing = await Tag.findOne({ where: { normalizedName } });
    if (existing) {
      return res.status(400).json({ error: '该标签已存在' });
    }

    const tag = await Tag.create({
      name: name.trim(),
      normalizedName,
      isOfficial: true,
      status: 'approved',
      createdBy: req.user.id
    });

    res.status(201).json({ tag });
  } catch (error) {
    console.error('管理员创建标签失败:', error);
    res.status(500).json({ error: '创建标签失败' });
  }
};

// 管理员：更新标签
const adminUpdateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const normalizedName = name.trim().toLowerCase();

    // 检查唯一性（排除自身）
    const existing = await Tag.findOne({
      where: { normalizedName, id: { [Op.ne]: id } }
    });
    if (existing) {
      return res.status(400).json({ error: '该标签名已存在' });
    }

    await tag.update({ name: name.trim(), normalizedName });
    res.json({ tag });
  } catch (error) {
    console.error('管理员更新标签失败:', error);
    res.status(500).json({ error: '更新标签失败' });
  }
};

// 管理员：删除标签
const adminDeleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }

    await tag.destroy(); // CASCADE 会处理 PostTagMap
    res.json({ message: '标签已删除' });
  } catch (error) {
    console.error('管理员删除标签失败:', error);
    res.status(500).json({ error: '删除标签失败' });
  }
};

// 管理员：审核通过标签
const adminApproveTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }

    await tag.update({ status: 'approved' });
    res.json({ tag });
  } catch (error) {
    console.error('审核标签失败:', error);
    res.status(500).json({ error: '审核标签失败' });
  }
};

// 管理员：拒绝标签（硬删除）
const adminRejectTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);

    if (!tag) {
      return res.status(404).json({ error: '标签不存在' });
    }

    await tag.destroy();
    res.json({ message: '标签已拒绝并删除' });
  } catch (error) {
    console.error('拒绝标签失败:', error);
    res.status(500).json({ error: '拒绝标签失败' });
  }
};

// 管理员：批量审核通过
const adminBatchApprove = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'tagIds 必须是非空数组' });
    }

    await Tag.update(
      { status: 'approved' },
      { where: { id: { [Op.in]: tagIds } } }
    );

    res.json({ message: `已批量审核 ${tagIds.length} 个标签` });
  } catch (error) {
    console.error('批量审核失败:', error);
    res.status(500).json({ error: '批量审核失败' });
  }
};

// 管理员：批量拒绝（删除 PostTagMap + Tag）
const adminBatchReject = async (req, res) => {
  try {
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: 'tagIds 必须是非空数组' });
    }

    await PostTagMap.destroy({ where: { tagId: { [Op.in]: tagIds } } });
    await Tag.destroy({ where: { id: { [Op.in]: tagIds } } });

    res.json({ message: `已批量拒绝并删除 ${tagIds.length} 个标签` });
  } catch (error) {
    console.error('批量拒绝失败:', error);
    res.status(500).json({ error: '批量拒绝失败' });
  }
};

// 管理员：合并标签
const adminMergeTags = async (req, res) => {
  try {
    const { sourceTagId, targetTagId } = req.body;

    if (!sourceTagId || !targetTagId) {
      return res.status(400).json({ error: '需要提供 sourceTagId 和 targetTagId' });
    }

    if (sourceTagId === targetTagId) {
      return res.status(400).json({ error: '源标签和目标标签不能相同' });
    }

    const result = await sequelize.transaction(async (t) => {
      const sourceTag = await Tag.findByPk(sourceTagId, { transaction: t });
      const targetTag = await Tag.findByPk(targetTagId, { transaction: t });

      if (!sourceTag) return { error: '源标签不存在', status: 404 };
      if (!targetTag) return { error: '目标标签不存在', status: 404 };

      // 获取源标签和目标标签各自关联的帖子ID
      const sourcePostIds = (await PostTagMap.findAll({
        where: { tagId: sourceTagId },
        attributes: ['postId'],
        transaction: t
      })).map(m => m.postId);

      const targetPostIds = (await PostTagMap.findAll({
        where: { tagId: targetTagId },
        attributes: ['postId'],
        transaction: t
      })).map(m => m.postId);

      // 计算需要迁移的帖子（在源但不在目标中的）
      const targetPostIdSet = new Set(targetPostIds);
      const uniquePostIds = sourcePostIds.filter(id => !targetPostIdSet.has(id));

      // 迁移唯一的关联
      if (uniquePostIds.length > 0) {
        await PostTagMap.update(
          { tagId: targetTagId },
          { where: { tagId: sourceTagId, postId: { [Op.in]: uniquePostIds } }, transaction: t }
        );
      }

      // 删除重复的关联（源标签中与目标标签重叠的帖子）
      await PostTagMap.destroy({
        where: { tagId: sourceTagId },
        transaction: t
      });

      // 删除源标签
      await sourceTag.destroy({ transaction: t });

      // 重新计算目标标签的帖子数
      const newPostCount = await PostTagMap.count({
        where: { tagId: targetTagId },
        transaction: t
      });
      await targetTag.update({ postCount: newPostCount }, { transaction: t });

      return { migratedCount: uniquePostIds.length };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ message: '标签合并成功', migratedCount: result.migratedCount });
  } catch (error) {
    console.error('合并标签失败:', error);
    res.status(500).json({ error: '合并标签失败' });
  }
};

module.exports = {
  getTags,
  getHotTags,
  suggestTags,
  createTag,
  adminGetTags,
  adminCreateTag,
  adminUpdateTag,
  adminDeleteTag,
  adminApproveTag,
  adminRejectTag,
  adminBatchApprove,
  adminBatchReject,
  adminMergeTags
};
