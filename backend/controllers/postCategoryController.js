const { PostCategory, Post, sequelize } = require('../models');

// 公开：获取活跃分类
const getCategories = async (req, res) => {
  try {
    const categories = await PostCategory.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
};

// 管理员：获取所有分类（含未激活）
const adminGetCategories = async (req, res) => {
  try {
    const categories = await PostCategory.findAll({
      order: [['sortOrder', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
};

// 管理员：创建分类
const adminCreateCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: '名称和slug为必填项' });
    }

    // 检查 slug 唯一性
    const existing = await PostCategory.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: '该slug已存在' });
    }

    // 自动计算 sortOrder = max + 1
    const maxOrder = await PostCategory.max('sortOrder') || 0;

    const category = await PostCategory.create({
      name,
      slug,
      description,
      sortOrder: maxOrder + 1
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ error: '创建分类失败' });
  }
};

// 管理员：更新分类
const adminUpdateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await PostCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    const { name, slug, description } = req.body;

    // 如果 slug 有变化，检查唯一性
    if (slug && slug !== category.slug) {
      const existing = await PostCategory.findOne({ where: { slug } });
      if (existing) {
        return res.status(400).json({ error: '该slug已存在' });
      }
    }

    await category.update({ name, slug, description });
    res.json({ category });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ error: '更新分类失败' });
  }
};

// 管理员：切换分类激活状态
const adminToggleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await PostCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    await category.update({ isActive: !category.isActive });
    res.json({ category });
  } catch (error) {
    console.error('切换分类状态失败:', error);
    res.status(500).json({ error: '切换分类状态失败' });
  }
};

// 管理员：重新排序分类
const adminReorderCategories = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds 必须是非空数组' });
    }

    const updates = orderedIds.map((id, index) =>
      PostCategory.update({ sortOrder: index }, { where: { id } })
    );
    await Promise.all(updates);

    res.json({ message: '排序更新成功' });
  } catch (error) {
    console.error('重新排序失败:', error);
    res.status(500).json({ error: '重新排序失败' });
  }
};

// 管理员：迁移分类（将某分类下的帖子迁移到另一分类）
const adminMigrateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetCategoryId } = req.body;

    const sourceCategory = await PostCategory.findByPk(id);
    if (!sourceCategory) {
      return res.status(404).json({ error: '源分类不存在' });
    }

    const targetCategory = await PostCategory.findByPk(targetCategoryId);
    if (!targetCategory) {
      return res.status(404).json({ error: '目标分类不存在' });
    }

    // 批量更新帖子的 categoryId
    await Post.update(
      { categoryId: targetCategoryId },
      { where: { categoryId: id } }
    );

    // 重新计算两个分类的帖子数
    const sourceCount = await Post.count({ where: { categoryId: id } });
    const targetCount = await Post.count({ where: { categoryId: targetCategoryId } });

    await sourceCategory.update({ postCount: sourceCount });
    await targetCategory.update({ postCount: targetCount });

    res.json({ message: '分类迁移成功' });
  } catch (error) {
    console.error('迁移分类失败:', error);
    res.status(500).json({ error: '迁移分类失败' });
  }
};

module.exports = {
  getCategories,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminToggleCategory,
  adminReorderCategories,
  adminMigrateCategory
};
