# 投哪儿 (pubWhere) 品牌升级设计

## 概述

将平台从「期刊论坛」升级为「投哪儿 (pubWhere)」，包含名称、标语变更及 SEO 增强。

## 品牌信息

| 项目 | 旧值 | 新值 |
|------|------|------|
| 中文名 | 期刊论坛 | 投哪儿 |
| 英文名 | Journal Forum | pubWhere |
| 标语 | 学术期刊评价与交流平台 | 找期刊，记投稿，聊学术 |
| 定位 | 学术期刊评价与交流 | 学者的投稿决策与经验分享平台 |

## 变更范围

### 1. 用户界面

| 文件 | 位置 | 变更 |
|------|------|------|
| `index.html` | `<title>` | `期刊论坛 - 学术期刊评价与交流平台` → `投哪儿 - 找期刊，记投稿，聊学术` |
| `src/components/layout/SideNav.tsx` | 第37行 | `期刊论坛` → `投哪儿` |

### 2. SEO 增强 (index.html)

新增以下 meta 标签：

```html
<meta name="description" content="找期刊，记投稿，聊学术 - 投哪儿帮助学者找到合适的期刊、记录投稿进度、分享学术经验">
<meta name="keywords" content="投哪儿,pubWhere,学术期刊,论文投稿,期刊评价,投稿经验">
<meta property="og:title" content="投哪儿 pubWhere">
<meta property="og:description" content="找期刊，记投稿，聊学术">
<meta property="og:type" content="website">
<meta property="og:locale" content="zh_CN">
```

### 3. 项目文档

| 文件 | 变更 |
|------|------|
| `CLAUDE.md` | 标题 `# Journal Forum - Claude 项目指南` → `# 投哪儿 (pubWhere) - Claude 项目指南` |

### 4. 后端配置

| 文件 | 字段 | 变更 |
|------|------|------|
| `backend/package.json` | description | `Backend service for Journal Forum application` → `Backend service for pubWhere` |
| `backend/package.json` | author | `Journal Forum Team` → `pubWhere Team` |

### 5. 测试文件

| 文件 | 变更 |
|------|------|
| `e2e/tests/user-flows.spec.ts` | `期刊论坛 - 用户流程测试` → `投哪儿 - 用户流程测试` |

## 不变更项

- Favicon/Logo（保持现有黄色气泡+星星图标）
- 代码包名（保持 `journal-forum-react` / `journal-forum-backend`）
- 视觉风格（保持现有主题系统）

## 验收标准

1. 浏览器标签页显示「投哪儿 - 找期刊，记投稿，聊学术」
2. 侧边栏展开时显示「投哪儿」品牌名
3. 查看页面源码可见 SEO meta 标签
4. E2E 测试通过
