# 期刊数据库重构实施计划

## 概述

将期刊系统从旧结构 (`journals` 表，INTEGER 主键) 迁移到新结构 (`online_journals` + `online_journal_levels` + `journal_rating_cache`，VARCHAR 拼音ID 主键)。

### 用户确认的决策
- **评分系统**: 方案 B - 新建 `journal_rating_cache` 表，完全分离
- **数据迁移**: 从零开始，不迁移旧数据
- **字段命名**: 直接使用新字段名 (journalId, name)

### 核心变更
| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 表名 | `journals` | `online_journals` |
| 主键 | `id` INTEGER | `journal_id` VARCHAR(50) |
| 字段 `title` | 存在 | 改名为 `name` |
| 分类 | `category` 单字段 | `online_journal_levels` 子表 |
| 评分缓存 | `dimensionAverages` 在主表 | 独立 `journal_rating_cache` 表 |

---

## 数据库表结构

### online_journals 主表
```sql
CREATE TABLE `online_journals` (
  `journal_id` VARCHAR(50) NOT NULL COMMENT '期刊唯一拼音ID (主键)',
  `name` VARCHAR(100) NOT NULL COMMENT '期刊名称',
  `supervisor` VARCHAR(100) DEFAULT NULL COMMENT '主管单位',
  `sponsor` VARCHAR(255) DEFAULT NULL COMMENT '主办单位',
  `issn` VARCHAR(20) DEFAULT NULL COMMENT '国际刊号',
  `cn` VARCHAR(20) DEFAULT NULL COMMENT '国内刊号',
  `publication_cycle` VARCHAR(20) DEFAULT NULL COMMENT '出版周期',
  `article_count` INT DEFAULT NULL COMMENT '文献量',
  `avg_citations` FLOAT DEFAULT NULL COMMENT '篇均被引频次',
  `impact_factor` FLOAT DEFAULT NULL COMMENT '影响因子',
  `total_citations` INT DEFAULT NULL COMMENT '总被引频次',
  `download_count` INT DEFAULT NULL COMMENT '下载量',
  `fund_paper_count` INT DEFAULT NULL COMMENT '基金论文量',
  `other_citation_rate` FLOAT DEFAULT NULL COMMENT '他引率',
  `fund_paper_rate` VARCHAR(20) DEFAULT NULL COMMENT '基金论文比',
  `cover_image_url` VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
  `former_name` VARCHAR(255) DEFAULT NULL COMMENT '曾用名',
  `editor_in_chief` VARCHAR(50) DEFAULT NULL COMMENT '主编',
  `language` VARCHAR(20) DEFAULT NULL COMMENT '语种',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  `postal_code` VARCHAR(20) DEFAULT NULL COMMENT '邮政编码',
  `email` VARCHAR(500) DEFAULT NULL COMMENT '电子邮箱',
  `phone` VARCHAR(500) DEFAULT NULL COMMENT '电话',
  `introduction` TEXT DEFAULT NULL COMMENT '期刊简介',
  `main_columns` JSON DEFAULT NULL COMMENT '主要栏目',
  `awards` JSON DEFAULT NULL COMMENT '获奖情况',
  `indexing_history` JSON DEFAULT NULL COMMENT '收录历史',
  PRIMARY KEY (`journal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### online_journal_levels 等级子表
```sql
CREATE TABLE `online_journal_levels` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `journal_id` VARCHAR(50) NOT NULL,
  `level_name` VARCHAR(50) NOT NULL COMMENT '北大核心, CSSCI, SCI, EI等',
  PRIMARY KEY (`id`),
  KEY `idx_journal_id` (`journal_id`),
  KEY `idx_level_name` (`level_name`),
  CONSTRAINT `fk_online_journals_id`
    FOREIGN KEY (`journal_id`)
    REFERENCES `online_journals` (`journal_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### journal_rating_cache 评分缓存表 (新建)
```sql
CREATE TABLE `journal_rating_cache` (
  `journal_id` VARCHAR(50) NOT NULL COMMENT '关联期刊ID',
  `rating` DECIMAL(2,1) DEFAULT 0 COMMENT '综合评分均值',
  `rating_count` INT DEFAULT 0 COMMENT '评分总数',
  `review_speed` DECIMAL(2,1) DEFAULT NULL COMMENT '审稿速度均值',
  `editor_attitude` DECIMAL(2,1) DEFAULT NULL COMMENT '编辑态度均值',
  `accept_difficulty` DECIMAL(2,1) DEFAULT NULL COMMENT '录用难度均值',
  `review_quality` DECIMAL(2,1) DEFAULT NULL COMMENT '审稿质量均值',
  `overall_experience` DECIMAL(2,1) DEFAULT NULL COMMENT '综合体验均值',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`journal_id`),
  CONSTRAINT `fk_rating_cache_journal`
    FOREIGN KEY (`journal_id`)
    REFERENCES `online_journals` (`journal_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='期刊评分缓存表';
```

---

## Phase 1: 后端模型层

### 1.1 重写 Journal 模型
**文件**: `backend/models/Journal.js`

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Journal = sequelize.define('Journal', {
  journalId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'journal_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  supervisor: DataTypes.STRING(100),
  sponsor: DataTypes.STRING(255),
  issn: DataTypes.STRING(20),
  cn: DataTypes.STRING(20),
  publicationCycle: {
    type: DataTypes.STRING(20),
    field: 'publication_cycle'
  },
  // 数值指标
  articleCount: { type: DataTypes.INTEGER, field: 'article_count' },
  avgCitations: { type: DataTypes.FLOAT, field: 'avg_citations' },
  impactFactor: { type: DataTypes.FLOAT, field: 'impact_factor' },
  totalCitations: { type: DataTypes.INTEGER, field: 'total_citations' },
  downloadCount: { type: DataTypes.INTEGER, field: 'download_count' },
  fundPaperCount: { type: DataTypes.INTEGER, field: 'fund_paper_count' },
  otherCitationRate: { type: DataTypes.FLOAT, field: 'other_citation_rate' },
  // 文本字段
  fundPaperRate: { type: DataTypes.STRING(20), field: 'fund_paper_rate' },
  coverImageUrl: { type: DataTypes.STRING(255), field: 'cover_image_url' },
  formerName: { type: DataTypes.STRING(255), field: 'former_name' },
  editorInChief: { type: DataTypes.STRING(50), field: 'editor_in_chief' },
  language: DataTypes.STRING(20),
  address: DataTypes.STRING(255),
  postalCode: { type: DataTypes.STRING(20), field: 'postal_code' },
  email: DataTypes.STRING(500),
  phone: DataTypes.STRING(500),
  introduction: DataTypes.TEXT,
  // JSON 字段
  mainColumns: { type: DataTypes.JSON, field: 'main_columns' },
  awards: DataTypes.JSON,
  indexingHistory: { type: DataTypes.JSON, field: 'indexing_history' }
}, {
  tableName: 'online_journals',
  timestamps: false
});

module.exports = Journal;
```

### 1.2 新增 JournalLevel 模型
**文件**: `backend/models/JournalLevel.js` (新建)

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalLevel = sequelize.define('JournalLevel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  journalId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'journal_id'
  },
  levelName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'level_name'
  }
}, {
  tableName: 'online_journal_levels',
  timestamps: false
});

module.exports = JournalLevel;
```

### 1.3 新增 JournalRatingCache 模型
**文件**: `backend/models/JournalRatingCache.js` (新建)

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalRatingCache = sequelize.define('JournalRatingCache', {
  journalId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'journal_id'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    get() {
      const val = this.getDataValue('rating');
      return val === null ? 0 : parseFloat(val);
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'rating_count'
  },
  reviewSpeed: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'review_speed',
    get() {
      const val = this.getDataValue('reviewSpeed');
      return val === null ? null : parseFloat(val);
    }
  },
  editorAttitude: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'editor_attitude',
    get() {
      const val = this.getDataValue('editorAttitude');
      return val === null ? null : parseFloat(val);
    }
  },
  acceptDifficulty: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'accept_difficulty',
    get() {
      const val = this.getDataValue('acceptDifficulty');
      return val === null ? null : parseFloat(val);
    }
  },
  reviewQuality: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'review_quality',
    get() {
      const val = this.getDataValue('reviewQuality');
      return val === null ? null : parseFloat(val);
    }
  },
  overallExperience: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'overall_experience',
    get() {
      const val = this.getDataValue('overallExperience');
      return val === null ? null : parseFloat(val);
    }
  }
}, {
  tableName: 'journal_rating_cache',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = JournalRatingCache;
```

### 1.4 修改外键表模型
修改以下模型的 `journalId` 字段类型从 `INTEGER` 改为 `STRING(50)`：

| 文件 | 修改内容 |
|------|----------|
| `backend/models/Comment.js` | `journalId: DataTypes.STRING(50)` |
| `backend/models/Favorite.js` | `journalId: DataTypes.STRING(50)` |
| `backend/models/Post.js` | `journalId: DataTypes.STRING(50)` |
| `backend/models/Submission.js` | `journalId: DataTypes.STRING(50)` |

### 1.5 更新模型关联
**文件**: `backend/models/index.js`

```javascript
// 新增导入
const JournalLevel = require('./JournalLevel');
const JournalRatingCache = require('./JournalRatingCache');

// Journal 关联
Journal.hasMany(JournalLevel, { foreignKey: 'journalId', as: 'levels' });
JournalLevel.belongsTo(Journal, { foreignKey: 'journalId' });

Journal.hasOne(JournalRatingCache, { foreignKey: 'journalId', as: 'ratingCache' });
JournalRatingCache.belongsTo(Journal, { foreignKey: 'journalId' });

// 导出
module.exports = { ..., JournalLevel, JournalRatingCache };
```

---

## Phase 2: 后端控制器层

### 2.1 重写 journalController.js
**关键修改**:

1. **getJournals**: 搜索字段改为 `name`/`issn`/`cn`，include `JournalLevel` 和 `JournalRatingCache`
2. **getLevels**: 新增 - 获取所有等级选项
3. **searchJournals**: 搜索逻辑适配新字段
4. **getJournalById**: 直接使用字符串ID，移除 `Number()` 转换

```javascript
// 示例：getJournals 中的搜索逻辑
if (search) {
  where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { issn: { [Op.like]: `%${search}%` } },
    { cn: { [Op.like]: `%${search}%` } }
  ];
}

// 示例：按等级筛选 (使用 EXISTS 子查询优化)
if (level) {
  where[Op.and] = sequelize.literal(`EXISTS (
    SELECT 1 FROM online_journal_levels l
    WHERE l.journal_id = Journal.journal_id
    AND l.level_name = '${level}'
  )`);
}

// 示例：include 评分缓存
const journals = await Journal.findAll({
  where,
  include: [
    { model: JournalLevel, as: 'levels' },
    { model: JournalRatingCache, as: 'ratingCache' }
  ]
});
```

### 2.2 修改 commentController.js 评分缓存逻辑
评论增删改时，更新 `JournalRatingCache` 表而非 Journal 主表：

```javascript
// 重构 computeJournalDimensionAverages 函数
const updateJournalRatingCache = async (journalId) => {
  const comments = await Comment.findAll({
    where: { journalId, isDeleted: false, dimensionRatings: { [Op.ne]: null } }
  });

  if (comments.length === 0) {
    await JournalRatingCache.destroy({ where: { journalId } });
    return;
  }

  // 计算各维度平均值
  const dimensions = ['reviewSpeed', 'editorAttitude', 'acceptDifficulty', 'reviewQuality', 'overallExperience'];
  const sums = {};
  const counts = {};

  dimensions.forEach(dim => { sums[dim] = 0; counts[dim] = 0; });

  comments.forEach(c => {
    const ratings = c.dimensionRatings;
    if (ratings) {
      dimensions.forEach(dim => {
        if (ratings[dim] != null) {
          sums[dim] += ratings[dim];
          counts[dim]++;
        }
      });
    }
  });

  const averages = {};
  dimensions.forEach(dim => {
    averages[dim] = counts[dim] > 0 ? Math.round((sums[dim] / counts[dim]) * 10) / 10 : null;
  });

  // 计算综合评分
  const validAvgs = Object.values(averages).filter(v => v !== null);
  const rating = validAvgs.length > 0
    ? Math.round((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) * 10) / 10
    : 0;

  await JournalRatingCache.upsert({
    journalId,
    rating,
    ratingCount: comments.length,
    ...averages
  });
};
```

### 2.3 修改其他控制器
移除所有 `parseInt(journalId)` 和 `Number(id)`：

| 文件 | 修改位置 |
|------|----------|
| `commentController.js` | 7 处 `parseInt()` |
| `favoriteController.js` | 5 处 `parseInt()` |
| `journalController.js` | 4 处 `Number()` |
| `postController.js` | 添加字符串处理 |

---

## Phase 3: 前端类型定义

### 3.1 更新核心类型
**文件**: `src/types/index.ts`

```typescript
export interface Journal {
  journalId: string;        // 原 id: number
  name: string;             // 原 title
  issn?: string;
  cn?: string;
  supervisor?: string;
  sponsor?: string;
  impactFactor?: number;
  totalCitations?: number;
  articleCount?: number;
  publicationCycle?: string;
  coverImageUrl?: string;
  introduction?: string;
  levels?: JournalLevel[];
  ratingCache?: JournalRatingCache;
}

export interface JournalLevel {
  id: number;
  journalId: string;
  levelName: string;
}

export interface JournalRatingCache {
  journalId: string;
  rating: number;
  ratingCount: number;
  reviewSpeed?: number;
  editorAttitude?: number;
  acceptDifficulty?: number;
  reviewQuality?: number;
  overallExperience?: number;
}

// 修改所有 journalId: number 为 string
export interface Comment {
  journalId: string;  // 原 number
  // ...其他字段保持不变
}

export interface Favorite {
  journalId: string;  // 原 number
  // ...
}

export interface RatingSummary {
  journalId: string;  // 原 number
  // ...
}

export interface MyComment {
  journalId: string;  // 原 number
  // ...
}

export interface AdminComment {
  journalId: string;  // 原 number
  // ...
}

export interface SubmissionRecord {
  journalId?: string;  // 原 number
  // ...
}
```

### 3.2 更新服务层类型
| 文件 | 修改内容 |
|------|----------|
| `src/services/journalService.ts` | 适配新 Journal 接口，移除 categoryMap |
| `src/services/journalSearchService.ts` | `id` → `journalId`, `title` → `name` |
| `src/services/commentService.ts` | `journalId: number` → `string` |
| `src/services/favoriteService.ts` | `journalId: number` → `string` |
| `src/services/submissionService.ts` | `journalId: number` → `string` |

---

## Phase 4: 前端组件层

### 4.1 高优先级组件
| 组件 | 文件路径 | 修改内容 |
|------|----------|----------|
| JournalCard | `src/features/journals/components/JournalCard.tsx` | `title` → `name`, `id` → `journalId` |
| JournalDetailPanel | `src/features/journals/components/JournalDetailPanel.tsx` | 字段映射全面更新，显示新字段 |
| SearchAndFilter | `src/features/journals/components/SearchAndFilter.tsx` | 筛选项改为按等级 `levelName` |
| JournalPicker | `src/components/common/JournalPicker.tsx` | `id` → `journalId` |
| JournalInfoCard | `src/components/common/JournalInfoCard.tsx` | 字段映射更新 |

### 4.2 评论模块
| 组件 | 修改内容 |
|------|----------|
| CommentList.tsx | `journalId` prop 类型改为 `string` |
| CommentForm.tsx | `journalId` prop 类型改为 `string` |
| CommentItem.tsx | 检查 `journalId` 使用 |

### 4.3 其他模块
| 组件 | 修改内容 |
|------|----------|
| FavoriteButton.tsx | `journalId` 类型改为 `string` |
| PostCard/PostForm/PostDetail | 关联期刊字段适配 |
| SubmissionTracker.tsx | 期刊关联适配 |
| JournalManagement.tsx | 管理表单字段重构 |

### 4.4 Context 更新
**文件**: `src/contexts/JournalContext.tsx`
- 状态类型适配新 `Journal` 接口
- 筛选逻辑适配新字段

---

## Phase 5: 等级系统重构

### 5.1 废弃旧分类
旧系统在 `journalService.ts` 硬编码了 6 个分类（废弃）：
```typescript
// 废弃
const categoryMap = {
  'computer-science': '计算机科学',
  'biology': '生物学',
  // ...
};
```

### 5.2 新等级系统
改为从后端 API 动态获取等级列表：
```typescript
// 新增 API
GET /api/journals/levels → [{ levelName: '北大核心', count: 120 }, ...]

// 前端服务
export const getLevelOptions = async () => {
  const response = await api.get('/journals/levels');
  return response.data.levels;
};
```

---

## Phase 6: 测试更新

### 6.1 后端测试
| 文件 | 修改内容 |
|------|----------|
| `backend/__tests__/integration/journals.test.js` | 测试数据适配新结构 |
| `backend/__tests__/integration/comments.test.js` | `journalId` 改为字符串 |
| `backend/__tests__/helpers/testHelpers.js` | 测试数据生成器更新 |

### 6.2 前端测试
| 文件 | 修改内容 |
|------|----------|
| `src/__tests__/components/common/JournalPicker.test.tsx` | mock 数据更新 |
| `src/__tests__/components/common/JournalInfoCard.test.tsx` | mock 数据更新 |
| `src/__tests__/helpers/testUtils.tsx` | 测试工具更新 |

### 6.3 E2E 测试
| 文件 | 修改内容 |
|------|----------|
| `e2e/tests/journal-submission-integration.spec.ts` | 适配新数据结构 |
| `e2e/fixtures/test-data.ts` | 测试数据更新 |

---

## 执行顺序

```
1. 数据库建表
   ├── 确认 online_journals 表已存在
   ├── 确认 online_journal_levels 表已存在
   └── 执行 journal_rating_cache 建表 SQL

2. 后端模型 (Phase 1)
   ├── 1.1 Journal.js 重写
   ├── 1.2 JournalLevel.js 新建
   ├── 1.3 JournalRatingCache.js 新建
   ├── 1.4 修改 4 个外键模型 (Comment, Favorite, Post, Submission)
   └── 1.5 更新 index.js 关联

3. 后端控制器 (Phase 2)
   ├── 2.1 journalController.js 重写
   ├── 2.2 commentController.js 重构评分缓存逻辑
   └── 2.3 修改其他控制器 (移除 parseInt/Number)

4. 前端类型 (Phase 3)
   ├── 3.1 types/index.ts
   └── 3.2 服务层类型

5. 前端组件 (Phase 4)
   ├── 4.1 期刊组件
   ├── 4.2 评论组件
   └── 4.3 其他组件

6. 等级系统重构 (Phase 5)

7. 测试更新 (Phase 6)
```

---

## 验证方案

### 启动验证
```bash
# 后端启动（无错误）
cd backend && npm start

# 前端启动（无 TypeScript 错误）
npm run dev
```

### 功能验证
1. 访问首页，期刊列表正常加载
2. 搜索期刊，结果正确
3. 按等级筛选，数据正确
4. 查看期刊详情，新字段正常显示
5. 发表评论，journalId 正确关联
6. 收藏/取消收藏功能正常
7. 帖子关联期刊功能正常

### 测试验证
```bash
# 后端测试
cd backend && npm test

# 前端测试
npm test

# E2E 测试
npm run test:e2e
```

---

## 关键文件清单

### 后端 (14 文件)
- `backend/models/Journal.js` - **重写**
- `backend/models/JournalLevel.js` - **新建**
- `backend/models/JournalRatingCache.js` - **新建**
- `backend/models/Comment.js` - 修改 journalId 类型
- `backend/models/Favorite.js` - 修改 journalId 类型
- `backend/models/Post.js` - 修改 journalId 类型
- `backend/models/Submission.js` - 修改 journalId 类型
- `backend/models/index.js` - 添加新模型关联
- `backend/controllers/journalController.js` - **重写**
- `backend/controllers/commentController.js` - 重构评分缓存逻辑，移除 parseInt
- `backend/controllers/favoriteController.js` - 移除 parseInt
- `backend/controllers/postController.js` - 字符串处理
- `backend/controllers/submissionController.js` - 检查
- `backend/controllers/adminController.js` - 期刊管理适配

### 前端 (20+ 文件)
- `src/types/index.ts` - **大幅修改** (Journal, JournalLevel, JournalRatingCache 接口)
- `src/services/journalService.ts` - 适配新字段
- `src/services/journalSearchService.ts` - id→journalId, title→name
- `src/services/commentService.ts` - journalId 类型
- `src/services/favoriteService.ts` - journalId 类型
- `src/services/submissionService.ts` - journalId 类型
- `src/contexts/JournalContext.tsx` - 状态类型
- `src/features/journals/components/JournalCard.tsx` - 字段映射
- `src/features/journals/components/JournalDetailPanel.tsx` - **重写**显示逻辑
- `src/features/journals/components/SearchAndFilter.tsx` - 等级筛选
- `src/components/common/JournalPicker.tsx` - 字段映射
- `src/components/common/JournalInfoCard.tsx` - 字段映射
- `src/features/comments/components/*.tsx` - 3 个组件
- `src/features/admin/components/JournalManagement.tsx` - **重写**

### 测试 (10+ 文件)
- 后端集成测试: journals.test.js, comments.test.js, admin.test.js
- 前端组件测试: JournalPicker.test.tsx, JournalInfoCard.test.tsx, PostCard.test.tsx
- E2E 测试: journal-submission-integration.spec.ts
- 测试工具: testHelpers.js, testUtils.tsx
