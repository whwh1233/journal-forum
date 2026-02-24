# 主题系统使用指南

## 当前已实现主题

1. **默认蓝** (`default`) - 经典学术蓝色系
2. **温暖自然** (`warm-nature`) - 柔和米黄色系
3. **日落辉光** (`sunset-glow`) - 橙黄渐变色系
4. **复古橄榄** (`vintage-olive`) - 优雅自然色系
5. **柔和大地** (`soft-earth`) - 粉褐柔和色系
6. **暖秋大地** (`warm-autumn`) - 金黄暖秋色系

## 如何使用主题

1. 点击 TopBar 右侧的调色板图标
2. 在弹出的主题选择面板中选择喜欢的主题
3. 可使用右上角的 🌙/☀️ 按钮切换深浅模式（当前仅默认蓝主题支持深色模式）
4. 主题选择会自动保存到 localStorage，刷新页面后保持

## 如何添加新主题

### 第 1 步：在 `src/styles/global.css` 中定义主题变量

```css
[data-theme="新主题ID"] {
  /* 原始色板 */
  --theme-color-1: #xxxxxx;
  --theme-color-2: #xxxxxx;
  /* ... */

  /* 背景层次 */
  --color-page-bg: var(--theme-color-5);
  --color-background: var(--theme-color-4);
  --color-surface: var(--theme-color-3);

  /* 主色 */
  --color-accent: var(--theme-color-1);

  /* 文字 */
  --color-text: #深色;

  /* 导航栏、顶部栏等其他变量... */
}
```

**建议的颜色映射**：
- `--color-page-bg`: 最外层背景（最浅）
- `--color-background`: 内容区背景
- `--color-surface`: 卡片/表面背景
- `--color-accent`: 主色（按钮、链接）
- `--color-border`: 边框颜色
- `--nav-bg`: 侧边导航背景
- `--topbar-bg`: 顶部栏背景

### 第 2 步：在 `src/contexts/ThemeContext.tsx` 中注册主题

```typescript
const THEMES: ThemeConfig[] = [
  // ... 现有主题
  {
    id: '新主题ID',
    name: '主题名称',
    description: '主题描述',
    colors: {
      preview1: '#主色',     // 用于预览的主色
      preview2: '#次要色',   // 用于预览的次要色
      preview3: '#背景色',   // 用于预览的背景色
    },
  },
];
```

### 第 3 步：更新类型定义（可选）

在 `ThemeContext.tsx` 中更新 `ThemeId` 类型：

```typescript
export type ThemeId = 'default' | 'warm-nature' | '新主题ID';
```

完成！主题选择器会自动显示新主题。

## 色板推荐格式

提供 5 个颜色时，建议按以下顺序排列：

```
--color-1: #xxxxxx  （最深色/主色）
--color-2: #xxxxxx  （中间色）
--color-3: #xxxxxx  （浅色）
--color-4: #xxxxxx  （更浅）
--color-5: #xxxxxx  （最浅/背景色）
```

## 文件结构

```
journal-forum/
├── src/
│   ├── contexts/
│   │   └── ThemeContext.tsx       # 主题管理上下文
│   ├── components/
│   │   └── common/
│   │       ├── ThemePicker.tsx    # 主题选择器组件
│   │       └── ThemePicker.css    # 主题选择器样式
│   └── styles/
│       └── global.css             # 主题 CSS 变量定义
└── THEMES.md                      # 本文档
```

## 技术细节

- **存储方式**: localStorage (`app-theme`, `app-theme-mode`)
- **应用方式**: `document.documentElement.setAttribute('data-theme', themeId)`
- **CSS 优先级**: `[data-theme="xxx"]` 选择器会覆盖 `:root` 中的默认变量
- **HMR 支持**: 修改 CSS 后，Vite 会热更新主题样式

## 待办事项

- [ ] 为其他主题添加深色模式支持
- [ ] 添加更多预设主题（建议 4-5 个）
- [ ] 考虑添加自定义主题功能
- [ ] 添加主题预览功能（实时预览无需切换）
