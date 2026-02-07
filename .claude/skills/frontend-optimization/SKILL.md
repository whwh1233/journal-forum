---
name: frontend-optimization
description: 全面优化前端UI/UX设计、性能和代码质量。当需要改进用户界面、提升性能或重构前端代码时使用此skill。
disable-model-invocation: false
allowed-tools: Read, Grep, Glob, Edit, Write
---

# 前端优化 Skill

## 🎨 UI/UX 设计优化

### 1. 排版系统
**避免通用字体**，使用特色字体提升设计感：
- **优雅风格**: Playfair Display, Crimson Text
- **现代风格**: Space Grotesk, DM Sans, Plus Jakarta Sans
- **技术风格**: JetBrains Mono, Fira Code
- **中文友好**: Noto Sans SC, Source Han Sans

**排版规范**：
- 标题层级清晰（h1: 2.5rem, h2: 2rem, h3: 1.5rem）
- 正文行高 1.6-1.8
- 段落间距合理
- 响应式字体大小

### 2. 色彩和主题
**避免"AI审美"**（过度使用紫色渐变、极简设计）

**推荐配色方案**：
- 学术风格: 深蓝 + 金色 + 白色
- 现代风格: 靛青 + 青色 + 暖灰
- 自然风格: 橄榄绿 + 赭石 + 米色

**实现要求**：
- 提供暗黑/浅色模式
- WCAG AA级对比度（4.5:1）
- 使用CSS变量统一管理
- 语义化颜色命名

### 3. 动画和交互
**优先高影响力动画**，避免过度微交互

**关键动画**：
- 页面过渡（300-400ms）
- 模态框显示/隐藏
- 加载状态反馈
- 悬停反馈（subtle）

**技术实现**：
- 使用 `transition` 而非 `animation`（性能更好）
- 遵循自然缓动函数（ease-out, ease-in-out）
- 提供 `prefers-reduced-motion` 支持

### 4. 背景和布局
**创造深度**，而非纯色背景

**推荐技术**：
- 微妙渐变背景
- 纹理叠加（noise, grain）
- 网格系统（Grid + Flexbox）
- 卡片阴影和层次

## ⚡ 性能优化

### 加载性能
- [ ] 代码分割（React.lazy, dynamic import）
- [ ] 图片优化（WebP, responsive images）
- [ ] 移除未使用的CSS
- [ ] 启用资源压缩（gzip/brotli）
- [ ] 使用CDN加载字体

### 运行时性能
- [ ] React.memo 优化重渲染
- [ ] useMemo/useCallback 缓存计算
- [ ] 虚拟化长列表
- [ ] 防抖/节流事件处理器
- [ ] 监控性能指标（LCP, FID, CLS）

## 🔧 代码质量

### 组件设计
- 单一职责原则
- 提取可复用组件
- Props接口清晰
- TypeScript类型安全

### 样式管理
- CSS Modules或Tailwind避免污染
- 设计token统一管理
- 避免内联样式
- 响应式设计（mobile-first）

### 可访问性
- 语义化HTML
- ARIA标签
- 键盘导航
- 屏幕阅读器支持

## ✅ 优化检查清单

完成前端优化后验证：
- [ ] 视觉设计独特且专业
- [ ] 响应式布局在所有设备正常
- [ ] 无障碍性符合WCAG 2.1 AA
- [ ] 核心Web指标达标（LCP < 2.5s, FID < 100ms, CLS < 0.1）
- [ ] 跨浏览器兼容性测试
- [ ] 性能审计通过（Lighthouse > 90）
- [ ] 代码审查和测试覆盖

## 📝 使用示例

```bash
# 优化特定组件
/frontend-optimization src/components/Header.tsx

# 优化整个页面
/frontend-optimization src/pages/Home.tsx

# 全局样式优化
/frontend-optimization src/styles/global.css
```
