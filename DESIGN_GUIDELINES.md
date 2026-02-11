# 设计指南 - Apple 风格交互规范

> 本文档定义项目的视觉设计和交互规范，确保 UI 一致性和高质量用户体验。

---

## 1. 设计原则

### 1.1 Apple 设计哲学
- **简洁清晰** - 去除多余元素，突出核心内容
- **流畅自然** - 所有过渡都有动画，响应用户操作
- **视觉层次** - 通过大小、颜色、阴影建立信息层级
- **一致性** - 相同功能使用相同样式和交互模式
- **无障碍** - 支持键盘导航、屏幕阅读器、动画偏好

---

## 2. 颜色系统

### 2.1 基础色板
```css
/* 灰度 */
--gray-50:  #fafafa;   /* 背景 */
--gray-100: #f5f5f5;   /* 表面 */
--gray-200: #e5e5e5;   /* 边框 */
--gray-300: #d4d4d4;   /* 禁用 */
--gray-400: #a3a3a3;   /* 占位符 */
--gray-500: #737373;   /* 次要文字 */
--gray-600: #525252;   /* 正文 */
--gray-700: #404040;   /* 标题 */
--gray-800: #262626;   /* 强调 */
--gray-900: #171717;   /* 最深 */

/* 主色 */
--blue-500: #3b82f6;
--blue-600: #2563eb;   /* 主操作 */
--blue-700: #1d4ed8;   /* 主操作悬停 */

/* 辅助色 */
--indigo-600: #4f46e5; /* 次要操作 */
--purple-500: #a855f7; /* 装饰 */
--green-500: #10b981;  /* 成功 */
--orange-500: #f59e0b; /* 警告 */
--red-500: #ef4444;    /* 错误 */
```

### 2.2 语义化颜色
```css
/* 状态颜色 */
--color-success: #10b981;
--color-success-bg: #d1fae5;
--color-error: #dc3545;
--color-error-bg: #fee2e2;
--color-warning: #f59e0b;
--color-warning-bg: #fef3c7;
--color-info: #3b82f6;
--color-info-bg: #dbeafe;

/* 交互颜色 */
--color-link: var(--blue-600);
--color-link-hover: var(--blue-700);
--color-accent: var(--blue-600);

/* 表面颜色 */
--color-background: #ffffff;
--color-surface: var(--gray-50);
--color-border: var(--gray-200);
--color-text: var(--gray-900);
--color-text-muted: var(--gray-500);
```

### 2.3 使用规则
- **禁止硬编码颜色** - 所有颜色必须使用 CSS 变量
- **语义优先** - 优先使用语义变量 (`--color-error`) 而非原始色值 (`--red-500`)
- **深色模式兼容** - 所有颜色在深色模式下自动反转

---

## 3. 字体系统

### 3.1 字体家族
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'DM Sans', var(--font-sans);
```

### 3.2 字体层级
| 元素 | 字号 | 字重 | 行高 |
|------|------|------|------|
| H1 | 3rem (48px) | 700 | 1.2 |
| H2 | 2rem (32px) | 600 | 1.2 |
| H3 | 1.5rem (24px) | 600 | 1.2 |
| H4 | 1.25rem (20px) | 600 | 1.2 |
| Body | 1rem (16px) | 400 | 1.6 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 400 | 1.4 |

### 3.3 使用规则
- **标题**: `font-family: var(--font-display)`
- **正文**: `font-family: var(--font-sans)`
- **字距**: 标题使用 `letter-spacing: -0.025em`

---

## 4. 间距系统

### 4.1 间距比例
```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.5rem;   /* 24px */
--space-6:  2rem;     /* 32px */
--space-8:  3rem;     /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 5rem;     /* 80px */
```

### 4.2 使用场景
| 场景 | 推荐间距 |
|------|---------|
| 元素内边距 (紧凑) | `--space-2` ~ `--space-3` |
| 元素内边距 (常规) | `--space-4` ~ `--space-5` |
| 组件间距 | `--space-4` ~ `--space-6` |
| 区块间距 | `--space-8` ~ `--space-12` |

---

## 5. 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### 使用场景
| 元素 | 默认阴影 | 悬停阴影 |
|------|---------|---------|
| 卡片 | `--shadow-sm` | `--shadow-lg` |
| 弹窗 | `--shadow-xl` | - |
| 按钮 | 无 | `--shadow-md` |
| 下拉菜单 | `--shadow-lg` | - |

---

## 6. 圆角系统

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* 圆形 */
```

### 使用场景
| 元素 | 圆角 |
|------|------|
| 按钮 | `--radius-md` |
| 输入框 | `--radius-md` |
| 卡片 | `--radius-lg` |
| 弹窗 | `--radius-xl` |
| 头像 | `--radius-full` |
| 标签 | `--radius-sm` |

---

## 7. 动画系统

### 7.1 时长
```css
--duration-fast: 150ms;   /* 微交互 */
--duration-normal: 200ms; /* 常规过渡 */
--duration-slow: 300ms;   /* 页面过渡 */
```

### 7.2 缓动函数
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* 元素出现 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);    /* 常规过渡 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性效果 */
```

### 7.3 常用动画
```css
/* 淡入上滑 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 弹性缩放 */
@keyframes springScale {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}

/* 微光效果 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 7.4 无障碍
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. 组件规范

### 8.1 按钮

#### 状态
| 状态 | 样式变化 |
|------|---------|
| Default | 基础样式 |
| Hover | `translateY(-1px)` + `shadow-md` |
| Active | `scale(0.98)` |
| Focus | `outline: 2px solid var(--color-accent)` + `outline-offset: 2px` |
| Disabled | `opacity: 0.5` + `cursor: not-allowed` |

#### 变体
```css
/* 主按钮 */
.btn-primary {
  background: var(--blue-600);
  color: white;
}
.btn-primary:hover {
  background: var(--blue-700);
}

/* 次按钮 */
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* 危险按钮 */
.btn-danger {
  background: var(--color-error);
  color: white;
}

/* 幽灵按钮 */
.btn-ghost {
  background: transparent;
  color: var(--color-text);
}
```

### 8.2 卡片

```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### 8.3 输入框

```css
.input {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  transition: border-color var(--duration-fast),
              box-shadow var(--duration-fast);
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.input::placeholder {
  color: var(--gray-400);
}
```

### 8.4 弹窗 (Modal)

```css
/* 背景遮罩 */
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

/* 弹窗内容 */
.modal-content {
  background: var(--color-background);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  animation: springScale 300ms var(--ease-spring);
}

/* 尺寸变体 */
.modal-sm { max-width: 400px; }
.modal-md { max-width: 600px; }
.modal-lg { max-width: 800px; }
```

### 8.5 Toast 通知

```css
.toast {
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4);
  animation: slideInRight 400ms var(--ease-spring);
}

/* 类型变体 */
.toast-success { border-left: 4px solid var(--color-success); }
.toast-error { border-left: 4px solid var(--color-error); }
.toast-warning { border-left: 4px solid var(--color-warning); }
.toast-info { border-left: 4px solid var(--color-info); }
```

---

## 9. 页面过渡

### 9.1 路由切换动画
```css
/* 进入 */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms var(--ease-out);
}

/* 退出 */
.page-exit {
  opacity: 1;
}
.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-in;
}
```

### 9.2 列表动画 (交错效果)
```css
.list-item {
  animation: fadeInUp 300ms var(--ease-out);
  animation-fill-mode: both;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
/* ... */
```

---

## 10. 响应式断点

```css
/* 移动端优先 */
@media (min-width: 480px)  { /* 大手机 */ }
@media (min-width: 768px)  { /* 平板 */ }
@media (min-width: 1024px) { /* 笔记本 */ }
@media (min-width: 1280px) { /* 桌面 */ }
```

### 常见调整
| 元素 | 移动端 | 桌面 |
|------|--------|------|
| 容器最大宽度 | 100% | 1280px |
| H1 字号 | 1.75rem | 3rem |
| 卡片网格 | 1列 | 3-4列 |
| 弹窗宽度 | 95vw | max-width 限制 |

---

## 11. 代码检查清单

### 新增组件时
- [ ] 使用 CSS 变量而非硬编码颜色
- [ ] 包含 hover / focus / active / disabled 状态
- [ ] 添加过渡动画 (`transition`)
- [ ] 支持键盘导航 (`:focus-visible`)
- [ ] 测试深色模式
- [ ] 验证移动端显示

### 修改样式时
- [ ] 检查是否有硬编码颜色需要替换
- [ ] 确认修改不影响其他状态
- [ ] 测试动画是否流畅

---

## 12. 文件结构

```
src/
├── styles/
│   └── global.css          # 设计系统变量
├── components/
│   ├── common/
│   │   ├── Modal.tsx       # 弹窗
│   │   ├── Toast.tsx       # 通知
│   │   ├── Skeleton.tsx    # 骨架屏
│   │   ├── Breadcrumb.tsx  # 面包屑
│   │   └── BackButton.tsx  # 返回按钮
│   └── layout/
│       ├── Header.tsx      # 导航头部
│       └── Footer.tsx      # 页脚
└── contexts/
    └── ToastContext.tsx    # Toast 状态管理
```

---

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-11 | 1.0 | 初始版本，定义基础设计系统 |
