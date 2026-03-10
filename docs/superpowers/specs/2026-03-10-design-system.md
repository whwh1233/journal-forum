# Design System 设计系统规范

> 投哪儿 (pubWhere) 统一设计系统
> 创建日期: 2026-03-10

## 概述

本文档定义了项目的视觉设计规范，包括字体、字号、间距、组件尺寸和图标配对规则。所有组件必须遵循这些规范以确保视觉一致性。

## 1. Font Family 字体

| 用途 | 字体 | CSS 变量 | 备注 |
|------|------|----------|------|
| 全站主字体 | **Lexend** | `--font-sans` | 阅读优化、舒适现代 |
| 标题/展示 | Lexend (600-700) | `--font-display` | 同主字体，加粗 |
| 数字/数据 | Lexend | `--font-numeric` | 统一使用 |
| 代码/等宽 | JetBrains Mono | `--font-mono` | 保持现有 |

### Google Fonts 引入

```html
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS 变量定义

```css
:root {
  --font-sans: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-display: var(--font-sans);
  --font-numeric: var(--font-sans);
  --font-mono: 'JetBrains Mono', monospace;
}
```

## 2. Typography Scale 字号系统

**比例**: Perfect Fourth (1.333)
**基准**: 16px

| 层级 | 字号 | 行高 | 图标 | CSS 变量 | 用途 |
|------|------|------|------|----------|------|
| 2XL | 50px | 1.1 | — | `--text-2xl` | 品牌标题 |
| XL | 38px | 1.2 | 40px | `--text-xl` | 页面主标题 |
| LG | 28px | 1.3 | 32px | `--text-lg` | 区块标题 |
| MD | 21px | 1.4 | 24px | `--text-md` | 卡片标题 |
| **Base** | **16px** | **1.5** | **20px** | `--text-base` | 正文（默认） |
| SM | 14px | 1.5 | 16px | `--text-sm` | 辅助文本、按钮 |
| XS | 12px | 1.5 | 14px | `--text-xs` | 注释、时间戳 |

### CSS 变量定义

```css
:root {
  --text-2xl: 50px;
  --text-xl: 38px;
  --text-lg: 28px;
  --text-md: 21px;
  --text-base: 16px;
  --text-sm: 14px;
  --text-xs: 12px;

  /* 图标尺寸（与字号配对） */
  --icon-xl: 40px;
  --icon-lg: 32px;
  --icon-md: 24px;
  --icon-base: 20px;
  --icon-sm: 16px;
  --icon-xs: 14px;
}
```

### 图标配对规则

```
图标尺寸 = 字号 × 1.25（向上取整到偶数）
```

## 3. Spacing 间距系统

使用现有变量，统一替换所有硬编码值。

| 变量 | 值 | 用途 |
|------|-----|------|
| `--space-1` | 4px | 最小间距、图标与文字间隙 |
| `--space-2` | 8px | 紧凑元素间距 |
| `--space-3` | 12px | 小型组件内边距 |
| `--space-4` | 16px | 标准间距（默认） |
| `--space-5` | 24px | 中等间距 |
| `--space-6` | 32px | 大型区块间距 |
| `--space-8` | 48px | 区块分隔 |
| `--space-10` | 64px | 页面级分隔 |
| `--space-12` | 80px | 大型分隔 |

## 4. Component Sizing 组件尺寸

| 尺寸 | 高度 | 字号 | 图标 | 头像 | 圆角 | 用途 |
|------|------|------|------|------|------|------|
| XS | 24px | 12px | 14px | 20px | 4px | 紧凑标签、列表头像 |
| SM | 32px | 14px | 16px | 28px | 6px | 次要按钮、评论头像 |
| **MD** | **40px** | **16px** | **20px** | **36px** | **8px** | 主要按钮、标准输入（默认） |
| LG | 48px | 21px | 24px | 48px | 10px | 大按钮、详情头像 |
| XL | 56px | 28px | 32px | 64px | 12px | Hero CTA、个人主页头像 |

### CSS 变量定义

```css
:root {
  /* 组件高度 */
  --size-xs: 24px;
  --size-sm: 32px;
  --size-md: 40px;
  --size-lg: 48px;
  --size-xl: 56px;

  /* 头像尺寸 */
  --avatar-xs: 20px;
  --avatar-sm: 28px;
  --avatar-md: 36px;
  --avatar-lg: 48px;
  --avatar-xl: 64px;

  /* 圆角 */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
}
```

## 5. 实施范围

### 需要修改的文件

1. **global.css** — 添加新的 CSS 变量定义
2. **index.html** — 更新 Google Fonts 引入
3. **所有组件 CSS** — 替换硬编码值为变量

### 实施步骤

1. 在 `global.css` 中定义所有 CSS 变量
2. 更新 `index.html` 引入 Lexend 字体
3. 逐组件替换硬编码的字号、间距、尺寸
4. 统一所有 Lucide 图标使用配对尺寸
5. 验证视觉一致性

## 6. 组件清单

需要更新的主要组件：

- `TopBar.css` — 高度、字号、头像
- `SideNav.css` — 导航项高度、图标尺寸
- `JournalCard.css` — 标题、数据、间距
- `PostCard.css` — 布局、字号、间距
- `CommentItem.css` — 头像、字号
- `SearchAndFilter.css` — 输入框、按钮尺寸
- `Modal.css` — 标题、按钮
- `Badge.css` — 尺寸、字号
- 所有按钮、表单组件
