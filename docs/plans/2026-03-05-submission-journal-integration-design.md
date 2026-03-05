# 投稿追踪系统 - 期刊智能关联与数据整合 设计文档

**日期**: 2026-03-05
**设计方案**: 方案 B - 组件化重构
**状态**: 待评审

---

## 一、设计目标

将投稿追踪系统与现有期刊评价系统深度整合，提供智能期刊搜索、丰富的期刊信息展示和双向快捷入口，提升用户体验。

### 核心功能
1. **期刊智能搜索**：支持期刊名称/ISSN 模糊搜索，实时自动补全
2. **数据深度整合**：投稿记录关联期刊库数据，展示评分、评论等信息
3. **双向快捷入口**：期刊详情页 → 投稿记录，投稿记录 → 期刊详情
4. **可选关联模式**：支持从期刊库选择或手动输入自定义期刊名

---

## 二、架构设计

### 2.1 文件结构

#### 新建文件
```
src/
├── components/common/
│   ├── JournalPicker.tsx              # 期刊选择器组件
│   ├── JournalPicker.css
│   ├── JournalInfoCard.tsx            # 期刊信息卡片
│   └── JournalInfoCard.css
├── hooks/
│   └── useJournalSearch.ts            # 期刊搜索 Hook
└── services/
    └── journalSearchService.ts        # 期刊搜索 Service 层

backend/
├── controllers/
│   └── journalController.js           # 新增 searchJournals, getCategories
└── routes/
    └── journalRoutes.js               # 新增搜索和分类接口路由
```

#### 修改文件
```
src/features/submissions/SubmissionTracker.tsx    # 使用新组件
src/features/journals/pages/JournalDetailPage.tsx # 添加"记录投稿"按钮
```

### 2.2 组件关系

```
JournalDetailPage
    └─→ [记录投稿] 按钮
           └─→ navigate('/submissions?journalId=123')

SubmissionPage (原 SubmissionTracker)
    ├─→ useSearchParams() 读取 journalId
    ├─→ CreateManuscriptModal
    │       └─→ JournalPicker (预填期刊)
    └─→ SubmissionItem
            └─→ JournalInfoCard (展示关联期刊)

JournalPicker
    ├─→ useJournalSearch() Hook
    │       └─→ journalSearchService.searchJournals()
    └─→ localStorage (保存维度偏好)

JournalInfoCard
    ├─→ 点击期刊名称 → navigate(`/journals/${id}`)
    ├─→ 收藏按钮 → 乐观更新 + API 调用
    └─→ 查看评论按钮 → navigate(`/journals/${id}`)
```

---

## 三、后端 API 设计

### 3.1 期刊搜索接口

**路由**: `GET /api/journals/search`

**Query 参数**:
```typescript
{
  q: string;           // 搜索关键词（必填，至少 2 字符）
  category?: string;   // 分类过滤（可选）："SCI" | "EI" | "中文核心" 等
  page?: number;       // 页码，默认 1
  limit?: number;      // 每页数量，默认 10
}
```

**搜索逻辑**:
- 同时模糊匹配 `title` 和 `issn` 字段
- 如果提供 `category`，额外过滤 `category` 字段

**返回数据**:
```json
{
  "results": [
    {
      "id": 1,
      "title": "Nature",
      "issn": "0028-0836",
      "category": "SCI",
      "rating": 4.5,
      "reviews": 123,
      "dimensionAverages": {
        "reviewSpeed": 3.2,
        "editorAttitude": 4.1,
        "acceptDifficulty": 4.8,
        "reviewQuality": 4.5,
        "overallExperience": 4.3
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

**实现示例**:
```javascript
// backend/controllers/journalController.js
const searchJournals = async (req, res) => {
  const { q, category, page = 1, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: '搜索关键词至少需要 2 个字符' });
  }

  const where = {
    [Op.or]: [
      { title: { [Op.like]: `%${q}%` } },
      { issn: { [Op.like]: `%${q}%` } }
    ]
  };

  if (category) {
    where.category = category;
  }

  const { rows, count } = await Journal.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['title', 'ASC']]
  });

  res.json({
    results: rows,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: count > parseInt(page) * parseInt(limit)
  });
};

// backend/routes/journalRoutes.js
router.get('/search', searchJournals);
```

### 3.2 期刊分类接口

**路由**: `GET /api/journals/categories`

**返回数据**:
```json
{
  "categories": [
    { "name": "SCI", "count": 42 },
    { "name": "EI", "count": 35 },
    { "name": "中文核心", "count": 28 }
  ]
}
```

**实现示例**:
```javascript
const getCategories = async (req, res) => {
  const categories = await Journal.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['category'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });

  res.json({
    categories: categories.map(c => ({
      name: c.category,
      count: parseInt(c.dataValues.count)
    }))
  });
};

router.get('/categories', getCategories);
```

---

## 四、前端组件设计

### 4.1 Service 层

**文件**: `src/services/journalSearchService.ts`

```typescript
import axios from 'axios';

export interface JournalSearchParams {
  q: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface JournalSearchResult {
  id: number;
  title: string;
  issn: string;
  category: string;
  rating: number;
  reviews: number;
  dimensionAverages: {
    reviewSpeed?: number;
    editorAttitude?: number;
    acceptDifficulty?: number;
    reviewQuality?: number;
    overallExperience?: number;
  };
}

export interface JournalSearchResponse {
  results: JournalSearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const searchJournals = async (
  params: JournalSearchParams
): Promise<JournalSearchResponse> => {
  const response = await axios.get('/api/journals/search', { params });
  return response.data;
};
```

### 4.2 Custom Hook

**文件**: `src/hooks/useJournalSearch.ts`

```typescript
import { useState, useCallback, useRef } from 'react';
import { searchJournals, JournalSearchResult } from '../services/journalSearchService';

export const useJournalSearch = () => {
  const [results, setResults] = useState<JournalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (
    query: string,
    category?: string,
    isLoadMore = false
  ) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await searchJournals({
        q: query,
        category,
        page: currentPage,
        limit: 10
      });

      setResults(prev =>
        isLoadMore ? [...prev, ...response.results] : response.results
      );
      setHasMore(response.hasMore);
      setPage(currentPage);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('搜索失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadMore = useCallback((query: string, category?: string) => {
    if (!loading && hasMore) {
      search(query, category, true);
    }
  }, [loading, hasMore, search]);

  const reset = useCallback(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, []);

  return { results, loading, error, hasMore, search, loadMore, reset };
};
```

### 4.3 JournalPicker 组件

**文件**: `src/components/common/JournalPicker.tsx`

**Props**:
```typescript
interface JournalPickerProps {
  value: JournalSearchResult | null;
  onChange: (journal: JournalSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

**核心状态**:
```typescript
const [inputValue, setInputValue] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [categories, setCategories] = useState<Array<{name: string, count: number}>>([]);
const [displayDimensions, setDisplayDimensions] = useState<string[]>(() => {
  const saved = localStorage.getItem('journalPickerDimensions');
  return saved ? JSON.parse(saved) : ['reviewSpeed', 'overallExperience'];
});
```

**UI 结构**:
```
┌────────────────────────────────────┐
│ 分类标签区                          │
│ [全部] [SCI (42)] [EI (35)]        │
├────────────────────────────────────┤
│ 搜索框                              │
│ ┌──────────────────────────────┐   │
│ │ Nature               [×]      │   │  (已选中)
│ └──────────────────────────────┘   │
│ 或                                  │
│ ┌──────────────────────────────┐   │
│ │ 搜索期刊名称或ISSN...   🔍   │   │  (未选中)
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ 下拉列表（输入时显示）              │
│ ┌──────────────────────────────┐   │
│ │ 显示: [审稿速度] [综合体验]  │   │  (维度选择器)
│ ├──────────────────────────────┤
│ │ Nature            ⭐ 4.5 (123) │
│ │ ISSN: 0028-0836 | SCI          │
│ │ 审稿速度: ●●●○○ 综合体验: ●●●●○ │
│ ├──────────────────────────────┤
│ │ [加载更多]                     │
│ └──────────────────────────────┘
└────────────────────────────────────┘
```

**核心功能**:
- 输入 ≥2 字符，300ms 防抖后触发搜索
- 下拉列表顶部可切换显示 1-3 个维度（默认：审稿速度 + 综合体验）
- 维度偏好保存到 localStorage
- 滚动到底部自动加载更多（每页 10 条）
- 选中期刊后关闭下拉列表，显示期刊名 + 清除按钮
- 支持 AbortController 取消之前的请求

### 4.4 JournalInfoCard 组件

**文件**: `src/components/common/JournalInfoCard.tsx`

**Props**:
```typescript
interface JournalInfoCardProps {
  journal: {
    id: number;
    title: string;
    issn: string;
    category: string;
    rating: number;
    reviews: number;
    description?: string;
    dimensionAverages: {
      reviewSpeed?: number;
      editorAttitude?: number;
      acceptDifficulty?: number;
      reviewQuality?: number;
      overallExperience?: number;
    };
  };
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
}
```

**UI 结构**（分三个区域，高度约 280-320px）:
```
┌────────────────────────────────────┐
│ 区域1：顶部 - 基本信息（60px）      │
│ Nature (点击跳转)      ⭐ 4.5  [★] │
│ ISSN: 0028-0836 | SCI              │
├────────────────────────────────────┤
│ 区域2：中间 - 5个维度评分（150px） │
│ 审稿速度    ■■■□□ 3.2              │
│ 编辑态度    ■■■■□ 4.1              │
│ 录用难度    ■■■■■ 4.8              │
│ 审稿质量    ■■■■□ 4.5              │
│ 综合体验    ■■■■□ 4.3              │
├────────────────────────────────────┤
│ 区域3：底部 - 描述 + 操作（70px）  │
│ 顶级综合性科学期刊...（2行截断）   │
│ 123 条评论         [查看评论]      │
└────────────────────────────────────┘
```

**核心功能**:
- 期刊名称点击跳转详情页
- 收藏按钮支持快速收藏/取消，点击后 Toast 提示
- 描述最多显示 2 行，超出显示"..."，鼠标悬停显示完整内容（tooltip）
- 查看评论按钮跳转期刊详情页
- 期刊名称过长时截断 + tooltip

---

## 五、现有组件改造

### 5.1 SubmissionTracker.tsx 改造

#### CreateManuscriptModal 改造

**新增 Props**:
```typescript
interface CreateManuscriptModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  prefilledJournal?: JournalSearchResult | null;  // 新增
}
```

**表单改造**:
```tsx
// 原代码
<input
  type="text"
  value={journalName}
  onChange={e => setJournalName(e.target.value)}
/>

// 新代码
<JournalPicker
  value={selectedJournal}
  onChange={(journal) => {
    setSelectedJournal(journal);
    setJournalId(journal?.id || null);
    setJournalName(journal?.title || '');
  }}
  placeholder="搜索期刊名称或ISSN..."
/>
```

#### SubmissionItem 改造

```tsx
// 原代码：仅显示期刊名称
<span className="submission-journal-name">📰 {journalDisplayName}</span>

// 新代码：显示 JournalInfoCard 或提供关联按钮
{submission.journal ? (
  <JournalInfoCard
    journal={submission.journal}
    isFavorited={submission.journal.isFavorited}
    onFavoriteToggle={() => handleFavoriteToggle(submission.journal.id)}
  />
) : (
  <div className="unlinked-journal">
    <span className="journal-name">📰 {submission.journalName}</span>
    <button onClick={() => handleLinkJournal(submission.id)}>
      关联到期刊库
    </button>
  </div>
)}
```

**收藏处理**（乐观更新）:
```typescript
const handleFavoriteToggle = async (journalId: number) => {
  // 1. 乐观更新 UI
  setManuscripts(prev => prev.map(m => ({
    ...m,
    submissions: m.submissions?.map(s =>
      s.journal?.id === journalId
        ? { ...s, journal: { ...s.journal, isFavorited: !s.journal.isFavorited } }
        : s
    )
  })));

  try {
    // 2. 调用 API
    await toggleFavorite(journalId);
    toast.success(isFavorited ? '已取消收藏' : '已收藏');
  } catch (err) {
    // 3. 失败时回滚
    setManuscripts(prev => prev.map(m => ({
      ...m,
      submissions: m.submissions?.map(s =>
        s.journal?.id === journalId
          ? { ...s, journal: { ...s.journal, isFavorited: !s.journal.isFavorited } }
          : s
      )
    })));
    toast.error('操作失败，请重试');
  }
};
```

#### 接收 journalId URL 参数

```typescript
const SubmissionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const journalIdParam = searchParams.get('journalId');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledJournal, setPrefilledJournal] = useState<JournalSearchResult | null>(null);

  useEffect(() => {
    if (journalIdParam) {
      fetchJournalById(journalIdParam)
        .then(journal => {
          setPrefilledJournal(journal);
          setShowCreateModal(true);
        })
        .catch(err => {
          toast.error('期刊加载失败');
          setSearchParams({}, { replace: true });
        });
    }
  }, [journalIdParam]);

  const handleCreateSuccess = async (data: any) => {
    await createManuscript(data);
    setShowCreateModal(false);
    setPrefilledJournal(null);
    setSearchParams({}, { replace: true }); // 清除 URL 参数
    await loadData();
    toast.success('投稿记录已创建');
  };

  return (
    <>
      <button onClick={() => setShowCreateModal(true)}>新增稿件</button>

      {showCreateModal && (
        <CreateManuscriptModal
          onClose={() => {
            setShowCreateModal(false);
            setPrefilledJournal(null);
            setSearchParams({}, { replace: true });
          }}
          onSubmit={handleCreateSuccess}
          prefilledJournal={prefilledJournal}
        />
      )}
    </>
  );
};
```

### 5.2 JournalDetailPage.tsx 改造

**添加"记录投稿"按钮**:
```tsx
const JournalDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleRecordSubmission = () => {
    if (!user) {
      openAuthModal(); // 未登录，打开登录弹窗
      return;
    }
    navigate(`/submissions?journalId=${id}`);
  };

  return (
    <div className="journal-detail-page">
      <div className="page-header">
        <div className="left">
          <h1>{journal.title}</h1>
          <div className="meta">
            <span>ISSN: {journal.issn}</span>
            <span>| {journal.category}</span>
          </div>
        </div>
        <button className="record-submission-btn" onClick={handleRecordSubmission}>
          📝 记录投稿
        </button>
      </div>

      {/* 其他内容 */}
    </div>
  );
};
```

**按钮样式**（与期刊标题右对齐）:
```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.record-submission-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.record-submission-btn:hover {
  background: var(--color-primary-dark);
}
```

---

## 六、数据流设计

### 6.1 完整用户流程

**流程 1：从期刊详情页创建投稿记录**

```
1. 用户浏览期刊详情页 (/journals/1)
2. 点击"记录投稿"按钮
   - 未登录 → 打开登录弹窗
   - 已登录 → navigate('/submissions?journalId=1')
3. SubmissionPage 检测 URL 参数
   - 调用 fetchJournalById(1) 获取期刊详情
   - setPrefilledJournal(journal)
   - setShowCreateModal(true)
4. CreateManuscriptModal 打开，JournalPicker 自动填充期刊
5. 用户填写表单并提交
6. 创建成功后：
   - setSearchParams({}, { replace: true }) 清除 URL 参数
   - toast.success('投稿记录已创建')
   - 刷新投稿列表
```

**流程 2：在投稿记录中查看期刊信息**

```
1. 用户进入投稿管理页 (/submissions)
2. 查看某个投稿记录，JournalInfoCard 显示期刊信息
3. 用户操作：
   - 点击期刊名称 → navigate('/journals/1')
   - 点击收藏按钮 → 乐观更新 + API 调用 + Toast 提示
   - 点击查看评论 → navigate('/journals/1')
```

**流程 3：手动关联未关联的期刊**

```
1. 用户创建投稿时仅输入 journalName 字符串（未关联期刊库）
2. 投稿记录显示：
   📰 Nature Communications  [关联到期刊库]
3. 用户点击"关联到期刊库"按钮
4. 打开 JournalPicker 弹窗，预填搜索关键词为 journalName
5. 用户选择匹配的期刊
6. 调用 updateSubmission API 更新 journalId
7. 刷新列表，显示 JournalInfoCard
```

---

## 七、错误处理

### 7.1 错误场景与处理策略

| 错误场景 | 处理方式 |
|---------|---------|
| 期刊搜索接口失败 | Toast 提示"搜索失败，请重试"，下拉列表显示错误状态 |
| 分类接口加载失败 | 隐藏分类标签栏，不影响核心搜索功能 |
| 期刊详情接口失败（从 URL 获取）| Toast 提示"期刊加载失败"，关闭弹窗，清除 URL 参数 |
| 收藏/取消收藏失败 | Toast 提示失败信息，回滚 UI 状态（乐观更新失败后还原）|
| 未关联期刊的手动关联失败 | Toast 提示失败，保持原有 journalName 字符串不变 |
| 网络超时 | 统一 Toast 提示"网络超时，请检查连接" |
| 搜索请求频繁 | 使用 AbortController 取消之前的请求 |

### 7.2 边界情况

- **搜索无结果**: 下拉列表显示"未找到匹配的期刊，试试其他关键词"
- **分类无期刊**: 分类标签显示 count=0，点击后搜索返回空列表
- **期刊名称/描述过长**: 截断 + tooltip
- **未选择期刊直接提交**: 允许，保存 journalName 字符串（可选关联模式）
- **URL 参数 journalId 无效**: Toast 提示"期刊不存在"，清除参数

---

## 八、测试策略

### 8.1 后端测试

**文件**: `backend/__tests__/integration/journal.test.js`

- 搜索接口：成功搜索、关键词少于2字符、分类过滤、分页
- 分类接口：返回分类列表、按数量排序
- 边界情况：空数据库、特殊字符搜索、SQL 注入防护

### 8.2 前端组件测试

**JournalPicker**（`src/__tests__/components/JournalPicker.test.tsx`）:
- 输入2个字符触发搜索
- 防抖300ms生效
- 选中期刊后关闭下拉列表
- 分类切换
- 维度切换并保存到 localStorage
- 滚动加载更多

**JournalInfoCard**（`src/__tests__/components/JournalInfoCard.test.tsx`）:
- 渲染全部5个维度评分
- 点击期刊名称跳转详情页
- 收藏按钮切换状态
- 描述截断与 tooltip

**SubmissionTracker**（集成测试）:
- 使用 JournalPicker 创建投稿
- 显示 JournalInfoCard
- 收藏按钮乐观更新
- URL 参数接收与清除

### 8.3 E2E 测试

**文件**: `e2e/tests/journal-submission-integration.spec.ts`

**完整流程**:
1. 登录
2. 浏览期刊详情页
3. 点击"记录投稿"
4. 自动跳转并打开弹窗
5. 验证期刊预填
6. 填写表单并提交
7. 验证成功 Toast
8. 验证 URL 参数清除
9. 验证 JournalInfoCard 显示

---

## 九、技术规格

### 9.1 性能指标

- 搜索防抖延迟：300ms
- 搜索最少字符数：2
- 每页加载数量：10 条
- 请求取消：AbortController（用户快速输入时取消之前的请求）
- 无缓存策略（每次都请求最新数据）

### 9.2 用户体验

- 分类标签显示期刊数量（如"SCI (42)"）
- 下拉列表显示详细信息（期刊名、ISSN、分类、评分、2个维度）
- 维度可自定义（1-3个），默认：审稿速度 + 综合体验
- 维度偏好保存到 localStorage
- 收藏操作乐观更新 + Toast 反馈
- 期刊名称/描述过长自动截断 + tooltip

### 9.3 兼容性

- 保持现有"可选关联"模式（可以不选期刊，仅输入字符串）
- 未关联期刊的投稿记录显示"关联到期刊库"按钮
- 向后兼容现有投稿数据（journalId 可为 null）

---

## 十、实施计划

### Phase 1：后端 API 开发（1-2天）
1. 实现 `GET /api/journals/search` 接口
2. 实现 `GET /api/journals/categories` 接口
3. 编写后端集成测试
4. 手动测试 API 返回数据

### Phase 2：前端基础组件（2-3天）
1. 开发 `journalSearchService.ts`
2. 开发 `useJournalSearch.ts` Hook
3. 开发 `JournalPicker` 组件（含分类标签、搜索、维度切换）
4. 开发 `JournalInfoCard` 组件
5. 编写组件单元测试

### Phase 3：现有组件集成（2-3天）
1. 改造 `CreateManuscriptModal`（使用 JournalPicker）
2. 改造 `SubmissionItem`（显示 JournalInfoCard）
3. 改造 `SubmissionPage`（接收 URL 参数）
4. 改造 `JournalDetailPage`（添加"记录投稿"按钮）
5. 实现收藏乐观更新逻辑
6. 实现未关联期刊的手动关联功能

### Phase 4：测试与优化（1-2天）
1. 编写 E2E 测试
2. 手动测试完整流程
3. 修复 bug
4. 性能优化（防抖、请求取消等）
5. 样式调整

### Phase 5：文档与部署（0.5天）
1. 更新 CLAUDE.md
2. 提交代码
3. 部署到测试环境
4. 验收测试

**预计总工期**: 6-10 天

---

## 十一、风险与挑战

### 11.1 技术风险

1. **大规模重构风险**：
   - 改动涉及多个核心组件
   - 缓解措施：充分的单元测试和 E2E 测试，分阶段交付

2. **性能问题**：
   - 下拉列表滚动加载可能卡顿
   - 缓解措施：虚拟滚动（如果列表过长）

3. **数据一致性**：
   - 收藏状态乐观更新可能与服务器不一致
   - 缓解措施：失败时回滚，定期同步

### 11.2 产品风险

1. **用户习惯改变**：
   - 原有简单输入框改为复杂的自动补全
   - 缓解措施：保留"可选关联"模式，用户仍可手动输入

2. **期刊库数据不全**：
   - 小众期刊可能不在库中
   - 缓解措施：支持手动输入，提供"关联到期刊库"功能

---

## 十二、后续扩展

### 12.1 短期优化（v1.1）
- 虚拟滚动优化长列表性能
- 搜索历史记录（localStorage）
- 期刊推荐（基于用户历史投稿）

### 12.2 中期功能（v1.2）
- 期刊对比功能（选择多个期刊对比评分）
- 批量导入投稿记录（Excel）
- 投稿统计可视化（成功率、审稿周期分析）

### 12.3 长期规划（v2.0）
- AI 期刊推荐（基于稿件内容）
- 投稿经验社区化（分享到帖子系统）
- 学者身份认证（Edu 邮箱/ORCID）

---

## 附录

### A. 相关文档
- [CLAUDE.md](../../CLAUDE.md) - 项目总体架构
- [API_ROUTES.md](../../API_ROUTES.md) - API 路由文档

### B. 外部资源
- [React Hook Form 文档](https://react-hook-form.com/)
- [Sequelize 模糊查询文档](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators)

### C. 设计决策记录

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-03-05 | 选择方案 B（组件化重构） | 长期维护成本低，组件复用性强 |
| 2026-03-05 | 可选关联模式 | 保留灵活性，支持小众期刊 |
| 2026-03-05 | 下拉列表滚动加载 | 用户体验最好，符合常规交互习惯 |
| 2026-03-05 | 维度可自定义（1-3个） | 平衡灵活性和 UI 简洁性 |
| 2026-03-05 | 不使用缓存 | 保证数据实时性，避免缓存失效问题 |

---

**设计完成时间**: 2026-03-05
**设计人员**: Claude (AI Assistant)
**审核状态**: 待用户审核
