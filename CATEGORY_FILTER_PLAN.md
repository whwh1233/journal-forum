# 期刊分类筛选改造计划

## 进度跟踪

| 步骤 | 任务 | 状态 |
|------|------|------|
| 1 | 创建数据库表 SQL | ✅ 已完成（表已存在） |
| 2 | 创建 Category 模型 | ✅ 已完成 |
| 3 | 创建 JournalCategoryMap 模型 | ✅ 已完成 |
| 4 | 更新 models/index.js 关联 | ✅ 已完成 |
| 5 | 更新 journalController.js | ✅ 已完成 |
| 6 | 更新 journalRoutes.js | ✅ 已完成 |
| 7 | 更新前端类型定义 | ✅ 已完成 |
| 8 | 更新 journalService.ts | ✅ 已完成 |
| 9 | 更新 JournalContext.tsx | ✅ 已完成 |
| 10 | 更新 useJournals.ts | ✅ 已完成 |
| 11 | 更新 SearchAndFilter.tsx | ✅ 已完成 |
| 12 | 测试验证 | ✅ API 测试通过 |

## 数据库设计

### online_categories (分类字典表) - 已存在
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(50) | 分类名称 |
| level | INT | 层级：1=大类, 2=子类 |
| parent_id | INT | 父类ID |

### online_journal_category_map (期刊-分类映射表) - 已存在
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| journal_id | VARCHAR(50) | 期刊ID |
| category_id | INT | 分类ID（二级） |

## 已完成的文件改动

### 后端
- `backend/models/Category.js` - 新建，Category 模型
- `backend/models/JournalCategoryMap.js` - 新建，映射表模型
- `backend/models/index.js` - 添加模型导入和关联定义
- `backend/controllers/journalController.js` - 添加 getCategories，修改 getJournals 支持 categoryId
- `backend/routes/journalRoutes.js` - 添加 /categories 路由

### 前端
- `src/types/index.ts` - 添加 Category 类型
- `src/services/journalService.ts` - 添加 getCategories，修改 getJournals 参数
- `src/contexts/JournalContext.tsx` - 添加 categories 状态和 selectedCategoryId
- `src/hooks/useJournals.ts` - 暴露分类相关状态和方法
- `src/features/journals/components/SearchAndFilter.tsx` - 添加分类下拉选择器

## API 验证结果

### GET /api/journals/categories
返回树形结构的分类数据，包含一级分类和子分类，子分类包含期刊数量。

### GET /api/journals?categoryId=2
支持按分类ID筛选期刊，一级分类ID会自动展开为所有子分类。

## 使用说明

1. 在期刊列表页面的筛选栏中，新增"分类"下拉框
2. 选择分类后，自动筛选该分类下的所有期刊
3. 支持一级分类（展开为所有子分类）和二级分类筛选
4. 筛选标签显示当前选中的分类名称
