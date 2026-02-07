# CSS 设计系统使用指南

**项目**: 期刊论坛 (Journal Forum)
**最后更新**: 2026-02-07

---

## 🎨 配色方案

### 主色调（学术深蓝）
```css
var(--color-primary)       /* #1e3a8a - 主色 */
var(--color-primary-light) /* #3b82f6 - 亮色变体 */
var(--color-primary-dark)  /* #1e40af - 深色变体 */
```

**使用场景**:
- 标题文字
- 主要按钮
- 链接颜色
- 边框强调

**示例**:
```css
.button-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
}
```

---

### 强调色（金色）
```css
var(--color-accent)       /* #d97706 - 金色 */
var(--color-accent-light) /* #f59e0b - 亮金色 */
```

**使用场景**:
- 星级评分
- 强调按钮（如清除筛选）
- 装饰性渐变
- hover状态

**示例**:
```css
.star-rating__star {
  color: var(--color-accent);
}
```

---

### 中性色
```css
var(--color-text)           /* #1f2937 - 主要文字 */
var(--color-text-secondary) /* #6b7280 - 次要文字 */
var(--color-border)         /* #e5e7eb - 边框 */
var(--color-background)     /* #ffffff - 背景 */
var(--color-surface)        /* #f9fafb - 表面/卡片背景 */
```

---

## 📝 字体系统

### 标题字体（Crimson Text）
```css
font-family: var(--font-heading);
```

**特点**: 优雅的衬线字体，适合标题和强调文字
**权重**: 400, 600, 700, 400 italic

**使用场景**:
- `<h1>` - `<h6>` 标题
- Logo
- 卡片标题
- 模态框标题

**示例**:
```css
.journal-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.3rem;
}
```

---

### 正文字体（Inter）
```css
font-family: var(--font-body);
```

**特点**: 现代无衬线字体，清晰易读
**权重**: 300, 400, 500, 600, 700

**使用场景**:
- 正文内容
- 按钮文字
- 表单输入
- 描述文字

**示例**:
```css
.journal-description {
  font-family: var(--font-body);
  line-height: 1.7;
}
```

---

### 等宽字体（JetBrains Mono）
```css
font-family: var(--font-mono);
```

**特点**: 专业等宽字体
**权重**: 400, 500

**使用场景**:
- ISSN号码
- 代码片段
- 数据显示

**示例**:
```css
.journal-issn {
  font-family: var(--font-mono);
  letter-spacing: 0.025em;
}
```

---

## 📏 间距系统

```css
var(--spacing-xs)  /* 0.25rem (4px)  - 最小间距 */
var(--spacing-sm)  /* 0.5rem  (8px)  - 小间距 */
var(--spacing-md)  /* 1rem    (16px) - 中等间距 */
var(--spacing-lg)  /* 1.5rem  (24px) - 大间距 */
var(--spacing-xl)  /* 2rem    (32px) - 超大间距 */
var(--spacing-2xl) /* 3rem    (48px) - 最大间距 */
```

**使用原则**:
- 相关元素间距：`var(--spacing-sm)` 或 `var(--spacing-md)`
- 组件内边距：`var(--spacing-lg)` 或 `var(--spacing-xl)`
- 组件外边距：`var(--spacing-xl)` 或 `var(--spacing-2xl)`

**示例**:
```css
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
```

---

## 🔘 圆角系统

```css
var(--radius-sm) /* 0.375rem (6px)  - 小圆角 */
var(--radius-md) /* 0.5rem   (8px)  - 中等圆角 */
var(--radius-lg) /* 0.75rem  (12px) - 大圆角 */
```

**使用场景**:
- 按钮、输入框：`var(--radius-md)`
- 卡片、模态框：`var(--radius-lg)`
- 标签、徽章：`var(--radius-lg)` 或更大

---

## 🌑 阴影系统

```css
var(--shadow-sm) /* 轻微阴影 - 小元素 */
var(--shadow-md) /* 中等阴影 - 卡片默认 */
var(--shadow-lg) /* 深阴影   - hover/modal */
```

**定义**:
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

**使用原则**:
- 静态卡片：`var(--shadow-md)`
- hover状态：`var(--shadow-lg)`
- 模态框：`var(--shadow-lg)` + 自定义

---

## ⏱️ 过渡系统

```css
var(--transition-fast) /* 150ms - 快速反馈 */
var(--transition-base) /* 250ms - 标准过渡 */
var(--transition-slow) /* 350ms - 慢速动画 */
```

**缓动函数**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)

**使用场景**:
- 快速（150ms）：颜色变化、边框变化
- 标准（250ms）：transform、opacity
- 慢速（350ms）：复杂动画、页面入场

**示例**:
```css
.button {
  transition: all var(--transition-base);
}

.button:hover {
  transform: translateY(-2px);
}
```

---

## 🎭 常用动画模式

### 1. 淡入向上
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeInUp var(--transition-slow) ease-out;
}
```

---

### 2. 卡片悬停效果
```css
.card {
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

---

### 3. 渐变边框（伪元素）
```css
.element {
  position: relative;
}

.element::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.element:hover::before {
  opacity: 1;
}
```

---

### 4. 焦点状态（可访问性）
```css
.interactive-element:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.3);
}
```

---

## 📱 响应式断点

```css
/* 移动优先 - 默认样式针对移动设备 */

/* 平板 */
@media (max-width: 768px) {
  :root {
    font-size: 14px; /* 缩小基础字号 */
  }
}

/* 小手机 */
@media (max-width: 480px) {
  .container {
    padding: 0 var(--spacing-sm);
  }
}

/* 大桌面（如需要） */
@media (min-width: 1200px) {
  .container {
    max-width: 1200px;
  }
}
```

---

## ♿ 可访问性最佳实践

### 1. 视觉隐藏类
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**使用场景**: 表单label、屏幕阅读器提示

---

### 2. 焦点可见性
```css
/* ✅ 总是提供焦点样式 */
.button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.3);
}

/* ❌ 不要移除焦点而不提供替代 */
.button {
  outline: none; /* 危险！ */
}
```

---

### 3. 减少动画偏好
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 4. 颜色对比度要求
- 正文文字：≥ 4.5:1（WCAG AA）
- 大标题文字：≥ 3:1（WCAG AA）
- 交互元素：≥ 4.5:1

**检查工具**: Chrome DevTools、axe DevTools

---

## 🎯 组件样式模板

### 按钮模板
```css
.button {
  /* 布局 */
  padding: var(--spacing-sm) var(--spacing-lg);

  /* 外观 */
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);

  /* 字体 */
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;

  /* 交互 */
  cursor: pointer;
  transition: all var(--transition-base);

  /* 阴影 */
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.3);
}

.button:active {
  transform: translateY(0);
}

.button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.3);
}
```

---

### 卡片模板
```css
.card {
  /* 布局 */
  padding: var(--spacing-lg);

  /* 外观 */
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);

  /* 阴影 */
  box-shadow: var(--shadow-md);

  /* 交互 */
  transition: all var(--transition-base);
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}
```

---

### 输入框模板
```css
.input {
  /* 布局 */
  padding: var(--spacing-md) var(--spacing-lg);
  width: 100%;

  /* 外观 */
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);

  /* 字体 */
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-text);

  /* 交互 */
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}
```

---

## 🚫 禁止使用

### ❌ 硬编码颜色
```css
/* 不要这样做 */
.element {
  color: #333;
  background: #1a73e8;
  border: 1px solid #e1e5e9;
}

/* ✅ 应该这样做 */
.element {
  color: var(--color-text);
  background: var(--color-primary);
  border: 1px solid var(--color-border);
}
```

---

### ❌ 硬编码间距
```css
/* 不要这样做 */
.element {
  padding: 16px;
  margin-bottom: 24px;
}

/* ✅ 应该这样做 */
.element {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

---

### ❌ 过度使用 !important
```css
/* 不要这样做 */
.element {
  color: red !important;
}

/* ✅ 应该提高选择器优先级 */
.parent .element {
  color: red;
}
```

---

### ❌ 移除焦点样式而不替代
```css
/* 不要这样做 */
* {
  outline: none; /* 危险！ */
}

/* ✅ 提供自定义焦点样式 */
*:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.3);
}
```

---

## 📚 快速参考

### 常用渐变
```css
/* 主色渐变 */
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);

/* 装饰性渐变 */
background: linear-gradient(to right, var(--color-primary), var(--color-accent));

/* 微妙背景渐变 */
background: linear-gradient(to bottom, var(--color-surface) 0%, var(--color-background) 100%);
```

---

### 常用过渡
```css
/* 标准过渡 */
transition: all var(--transition-base);

/* 多属性过渡 */
transition:
  transform var(--transition-base),
  box-shadow var(--transition-base),
  border-color var(--transition-base);
```

---

### 常用transform
```css
/* 向上移动 */
transform: translateY(-4px);

/* 缩放 */
transform: scale(1.05);

/* 旋转 */
transform: rotate(90deg);

/* 组合 */
transform: translateY(-4px) scale(1.02);
```

---

## 🎓 学习资源

- **CSS变量**: [MDN - Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **可访问性**: [WebAIM - WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist)
- **字体**: [Google Fonts](https://fonts.google.com/)
- **颜色对比**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

*设计系统指南 v1.0*
*最后更新: 2026-02-07*
