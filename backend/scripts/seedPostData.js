require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, User, Post, PostComment, PostLike, PostFavorite, PostFollow } = require('../models');

// 测试帖子数据模板
const postTemplates = [
  {
    title: 'Nature 投稿经验分享：从构思到录用的完整流程',
    content: `# 投稿背景

我最近成功在 Nature 上发表了一篇关于量子计算的文章，想和大家分享一下完整的投稿经验。

## 前期准备

- **选题**: 确保研究具有足够的创新性和影响力
- **实验验证**: 完成所有必要的对照实验
- **数据分析**: 使用多种统计方法验证结果

## 投稿过程

整个过程大约花了 **8 个月**时间：

1. 初次投稿 (第 1 个月)
2. 第一轮审稿 (第 2-4 个月)
3. 修改回复 (第 5-6 个月)
4. 第二轮审稿 (第 7 个月)
5. 最终录用 (第 8 个月)

## 审稿意见处理

审稿人提出了以下主要问题：

\`\`\`
1. 需要补充理论推导
2. 实验数据需要更多重复
3. 讨论部分需要扩展
\`\`\`

我们针对每个问题都做了详细的回复和补充实验。

## 经验总结

- ✅ 选择合适的期刊很重要
- ✅ 审稿意见要认真对待
- ✅ 保持与编辑的良好沟通
- ⚠️ 不要低估修改所需的时间

希望对大家有帮助！`,
    category: 'experience',
    tags: ['Nature', 'SCI', '投稿经验', '量子计算']
  },
  {
    title: '关于开放获取（OA）期刊的讨论：利与弊',
    content: `最近在考虑是否选择 OA 期刊发表文章，想听听大家的看法。

## OA 的优势

1. **更广泛的传播**: 任何人都可以免费阅读
2. **引用率可能更高**: 开放获取增加了可见度
3. **符合资助方要求**: 很多基金要求开放获取

## OA 的劣势

1. **高昂的 APC 费用**: 通常在 $2000-$5000
2. **质量参差不齐**: 一些掠夺性期刊混在其中
3. **预算限制**: 不是所有实验室都能承担

## 我的疑问

- 大家有推荐的高质量 OA 期刊吗？
- 如何识别掠夺性期刊？
- APC 费用有办法申请减免吗？

欢迎讨论！`,
    category: 'discussion',
    tags: ['OA期刊', '开放获取', 'APC', '学术出版']
  },
  {
    title: '求助：论文被拒后是否应该申诉？',
    content: `# 情况说明

我的论文刚刚被一个 SCI Q1 期刊拒稿，审稿意见如下：

**审稿人1**：认为研究方法有问题
**审稿人2**：认为创新性不足
**编辑**：建议改投其他期刊

## 我的看法

我认为审稿人1对方法学的理解有误，因为：
- 我们采用的是该领域的标准方法
- 已有多篇高影响因子文章使用相同方法

## 我的问题

1. 这种情况值得申诉吗？
2. 申诉成功的几率有多大？
3. 申诉会不会影响以后在该期刊的投稿？

求有经验的老师指点！🙏`,
    category: 'question',
    tags: ['拒稿', '申诉', '审稿意见', '求助']
  },
  {
    title: '重磅！中科院分区 2024 年最新调整',
    content: `## 最新消息

中科院文献情报中心今天发布了 2024 年期刊分区表的调整方案。

### 主要变化

- **大类调整**: 部分期刊的大类归属发生变化
- **分区标准**: Q1 期刊比例从 5% 调整为 10%
- **影响因子**: 不再是唯一评价标准

### 影响较大的期刊

1. **Nature Communications**: 保持在 Q1
2. **PLOS ONE**: 从 Q2 调整为 Q3
3. **Scientific Reports**: 维持 Q3

### 对科研人员的影响

这次调整可能会影响：
- 毕业要求
- 职称评审
- 项目结题

大家怎么看这次调整？

[官方公告链接](https://example.com)`,
    category: 'news',
    tags: ['中科院分区', 'JCR分区', 'SCI', '期刊评价']
  },
  {
    title: '文献综述：近年来人工智能在医学影像中的应用',
    content: `# 摘要

本文综述了 2020-2024 年间人工智能（AI）在医学影像领域的主要进展。

## 1. 图像分类

深度学习模型在疾病分类任务中表现优异：

| 任务 | 准确率 | 代表性研究 |
|------|--------|-----------|
| 肺炎检测 | 95%+ | Zhang et al., 2023 |
| 肿瘤分类 | 92%+ | Li et al., 2023 |
| 眼底病变 | 94%+ | Wang et al., 2024 |

## 2. 图像分割

\`\`\`python
# U-Net 架构示例
def unet_model(input_shape):
    inputs = Input(input_shape)
    # 编码器
    conv1 = Conv2D(64, 3, activation='relu')(inputs)
    # 解码器
    # ...
    return Model(inputs, outputs)
\`\`\`

## 3. 未来展望

- **可解释性**: 提高模型的可解释性
- **数据隐私**: 联邦学习等技术的应用
- **临床转化**: 从实验室到临床的桥梁

## 参考文献

1. Zhang, Y. et al. (2023). *Nature Medicine*
2. Li, X. et al. (2023). *The Lancet*
3. Wang, Z. et al. (2024). *NEJM*`,
    category: 'review',
    tags: ['文献综述', '人工智能', '医学影像', '深度学习']
  },
  {
    title: 'Elsevier 期刊投稿系统使用技巧',
    content: `分享一些在 Elsevier Editorial System (EES) 投稿时的实用技巧。

## 注册账号

- 使用学术邮箱注册
- 完善 ORCID 信息
- 添加合作者信息

## 上传文件

**正确的文件格式**：
- 正文：Word (.docx) 或 LaTeX (.tex)
- 图片：TIFF, EPS, PDF（高分辨率）
- 表格：可嵌入正文或单独文件

## 常见问题

❌ **错误做法**：
- 图片分辨率过低（< 300 dpi）
- 文件命名不规范
- 未按期刊格式要求排版

✅ **正确做法**：
- 仔细阅读 Guide for Authors
- 使用期刊提供的模板
- 提交前检查所有文件

## 投稿后追踪

- 定期检查状态
- 及时回复编辑邮件
- 如超过正常审稿时间可礼貌催稿`,
    category: 'experience',
    tags: ['Elsevier', '投稿系统', '技巧', '教程']
  },
  {
    title: '如何高效阅读和管理文献？',
    content: `# 文献管理经验分享

作为博士生，我每周要阅读 10-15 篇文献，分享一下我的管理方法。

## 工具选择

我使用的工具组合：
- **Zotero**: 文献管理（免费开源）
- **Notion**: 笔记整理
- **MarginNote**: PDF 批注

## 阅读策略

### 三遍阅读法

**第一遍（5分钟）**：
- 读摘要和结论
- 看图表
- 判断是否值得深读

**第二遍（30分钟）**：
- 详读方法和结果
- 记录关键点
- 思考与自己研究的关联

**第三遍（2小时+）**：
- 精读全文
- 批判性思考
- 整理到知识体系

## 笔记模板

\`\`\`markdown
# 文献标题
- 作者：XXX
- 期刊：XXX
- 年份：2024

## 核心观点
-
## 方法创新
-
## 启发
-
\`\`\`

大家有什么好的阅读方法吗？`,
    category: 'discussion',
    tags: ['文献阅读', 'Zotero', '科研方法', '效率']
  },
  {
    title: 'IEEE Transactions 系列期刊投稿难度对比',
    content: `整理了一下 IEEE Transactions 系列几个热门期刊的投稿难度，供大家参考。

## 计算机视觉方向

### IEEE TPAMI (Top 1)
- **影响因子**: 20.8
- **录用率**: ~10%
- **审稿周期**: 6-9 个月
- **难度**: ⭐⭐⭐⭐⭐

### IEEE TIP (Top 2)
- **影响因子**: 10.6
- **录用率**: ~15%
- **审稿周期**: 4-6 个月
- **难度**: ⭐⭐⭐⭐

### IEEE TCSVT
- **影响因子**: 8.3
- **录用率**: ~20%
- **审稿周期**: 3-5 个月
- **难度**: ⭐⭐⭐

## 我的投稿经历

去年尝试投了 TPAMI，历时 8 个月，经过两轮审稿后被拒。审稿意见非常详细，对后续研究帮助很大。

改投 TIP 后 5 个月顺利录用。

## 建议

- 新手建议先投 TCSVT 积累经验
- 有充分把握再冲击 TPAMI
- 审稿意见都很有价值，认真对待`,
    category: 'experience',
    tags: ['IEEE', 'TPAMI', 'TIP', '投稿难度']
  }
];

// 评论模板
const commentTemplates = [
  '感谢分享！这个经验太有用了 👍',
  '请问审稿周期大概多久？',
  '我也遇到过类似的情况，最后选择了改投其他期刊',
  '非常详细的总结，收藏了！',
  '有个问题：审稿费大概是多少？',
  '楼主的经验很宝贵，我也准备投这个期刊',
  '审稿人的意见一般会有哪些方面？',
  '这个分享来得太及时了，正好需要',
  '请问需要找润色公司吗？',
  '我的文章也在审稿中，希望能顺利通过',
  '非常实用的建议，已经按照这个思路准备了',
  '有没有推荐的参考文献格式工具？',
  '这个领域确实很有发展前景',
  '请问对英语水平要求高吗？',
  '感谢楼主的无私分享 🙏',
  '我觉得这个方法值得推广',
  '有没有更详细的数据分析方法？',
  '请问有模板可以参考吗？',
  '这个期刊的审稿质量确实不错',
  '我去年也投过，经历类似',
  '建议补充一些图表说明',
  '非常专业的分析！',
  '请问需要cover letter吗？',
  '这个经验对我帮助很大',
  '有点疑问：第二轮审稿一般多久？',
  '非常感谢分享，已转发给同学',
  '我也在准备投稿，这些信息很有价值',
  '请问有推荐的写作书籍吗？',
  '审稿意见的回复有什么技巧？',
  '这个帖子解决了我的很多疑惑'
];

// 回复评论模板
const replyTemplates = [
  '审稿周期大概是 3-6 个月，看具体情况',
  '不需要审稿费，但是有版面费',
  '我是找的专业润色公司，效果还不错',
  '一般审稿人会关注创新性、方法学和数据质量',
  'Cover letter 很重要，要突出创新点',
  '建议使用 Endnote 或 Zotero',
  '英语水平要求还是挺高的，建议找母语者帮忙',
  '我用的是期刊官网提供的模板',
  '可以参考已发表文章的图表格式',
  '回复审稿意见要详细、有礼貌',
  '第二轮审稿通常会快一些，1-2个月',
  '我觉得这本书不错：《How to Write and Publish a Scientific Paper》',
  '数据分析建议用 R 或 Python',
  '祝你投稿顺利！',
  '有问题可以继续交流',
  '希望对你有帮助',
  '加油！相信你一定可以的',
  '我的经验仅供参考',
  '具体还是要看期刊的要求',
  '建议多看看已发表的文章'
];

async function seedPostData() {
  try {
    console.log('开始生成帖子测试数据...\n');

    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 获取现有用户
    const users = await User.findAll();
    if (users.length === 0) {
      console.log('✗ 未找到用户，请先创建用户账号');
      return;
    }
    console.log(`✓ 找到 ${users.length} 个用户\n`);

    // 清理现有帖子数据（可选）
    console.log('清理现有帖子数据...');
    await PostComment.destroy({ where: {}, force: true });
    await PostLike.destroy({ where: {}, force: true });
    await PostFavorite.destroy({ where: {}, force: true });
    await PostFollow.destroy({ where: {}, force: true });
    await Post.destroy({ where: {}, force: true });
    console.log('✓ 清理完成\n');

    // 创建帖子
    console.log('创建帖子...');
    const createdPosts = [];

    for (let i = 0; i < postTemplates.length; i++) {
      const template = postTemplates[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // 随机生成统计数据
      const viewCount = Math.floor(Math.random() * 1000) + 50;
      const likeCount = Math.floor(Math.random() * 50);
      const commentCount = Math.floor(Math.random() * 20);
      const favoriteCount = Math.floor(Math.random() * 30);
      const followCount = Math.floor(Math.random() * 15);

      // 计算热度分数
      const hotScore = viewCount * 0.1 + likeCount * 2 + commentCount * 3 + favoriteCount * 1.5;

      const post = await Post.create({
        userId: randomUser.id,
        title: template.title,
        content: template.content,
        category: template.category,
        tags: template.tags,
        viewCount,
        likeCount,
        commentCount,
        favoriteCount,
        followCount,
        hotScore,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 随机过去30天内
      });

      createdPosts.push(post);
      console.log(`  ✓ 创建帖子 ${i + 1}/${postTemplates.length}: ${template.title.substring(0, 30)}...`);
    }

    console.log(`\n✓ 成功创建 ${createdPosts.length} 篇帖子\n`);

    // 为每篇帖子创建评论
    console.log('创建评论...');
    let totalComments = 0;

    for (const post of createdPosts) {
      const numComments = Math.floor(Math.random() * 8) + 3; // 每篇3-10条评论

      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

        // 创建父评论
        const parentComment = await PostComment.create({
          postId: post.id,
          userId: randomUser.id,
          content: randomComment,
          depth: 0,
          likeCount: Math.floor(Math.random() * 10),
          createdAt: new Date(post.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        });

        totalComments++;

        // 30% 概率创建回复
        if (Math.random() < 0.3) {
          const replyUser = users[Math.floor(Math.random() * users.length)];
          const randomReply = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];

          await PostComment.create({
            postId: post.id,
            userId: replyUser.id,
            parentId: parentComment.id,
            content: randomReply,
            depth: 1,
            likeCount: Math.floor(Math.random() * 5),
            createdAt: new Date(parentComment.createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000)
          });

          totalComments++;
        }
      }
    }

    console.log(`✓ 成功创建 ${totalComments} 条评论\n`);

    // 创建一些点赞和收藏
    console.log('创建互动数据...');
    let totalLikes = 0;
    let totalFavorites = 0;
    let totalFollows = 0;

    for (const post of createdPosts) {
      // 随机为帖子添加点赞
      const numLikes = Math.floor(Math.random() * users.length / 2);
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numLikes; i++) {
        try {
          await PostLike.create({
            userId: shuffledUsers[i].id,
            postId: post.id
          });
          totalLikes++;
        } catch (e) {
          // 忽略重复数据错误
        }
      }

      // 随机添加收藏
      const numFavorites = Math.floor(Math.random() * users.length / 3);
      for (let i = 0; i < numFavorites; i++) {
        try {
          await PostFavorite.create({
            userId: shuffledUsers[i].id,
            postId: post.id
          });
          totalFavorites++;
        } catch (e) {
          // 忽略重复数据错误
        }
      }

      // 随机添加关注
      const numFollows = Math.floor(Math.random() * users.length / 4);
      for (let i = 0; i < numFollows; i++) {
        try {
          await PostFollow.create({
            userId: shuffledUsers[i].id,
            postId: post.id
          });
          totalFollows++;
        } catch (e) {
          // 忽略重复数据错误
        }
      }
    }

    console.log(`✓ 创建 ${totalLikes} 个点赞`);
    console.log(`✓ 创建 ${totalFavorites} 个收藏`);
    console.log(`✓ 创建 ${totalFollows} 个关注\n`);

    // 统计总结
    console.log('========== 数据生成完成 ==========');
    console.log(`帖子总数: ${createdPosts.length}`);
    console.log(`评论总数: ${totalComments}`);
    console.log(`点赞总数: ${totalLikes}`);
    console.log(`收藏总数: ${totalFavorites}`);
    console.log(`关注总数: ${totalFollows}`);
    console.log('================================\n');

    console.log('✓ 测试数据生成成功！');
    console.log('现在可以访问 http://localhost:3000/community 查看帖子');

  } catch (error) {
    console.error('✗ 生成数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行脚本
seedPostData();
