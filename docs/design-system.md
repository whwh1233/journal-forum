# Design System 设计系统

统一的视觉设计规范，确保所有组件遵循一致的字体、间距、尺寸标准。

## 字体 (Font Family)

| 用途 | 字体 | CSS 变量 |
|------|------|----------|
| 全站主字体 | **Lexend** | `--font-sans` |
| 标题/展示 | Lexend (600-700) | `--font-display` |
| 代码/等宽 | JetBrains Mono | `--font-mono` |

## 字号系统 (Typography Scale)

**比例**: Perfect Fourth (1.333) | **基准**: 16px

| 层级 | 字号 | 图标 | CSS 变量 | 用途 |
|------|------|------|----------|------|
| 2XL | 50px | — | `--text-2xl` | 品牌标题 |
| XL | 38px | 40px | `--text-xl` | 页面主标题 |
| LG | 28px | 32px | `--text-lg` | 区块标题 |
| MD | 21px | 24px | `--text-md` | 卡片标题 |
| **Base** | **16px** | **20px** | `--text-base` | 正文（默认） |
| SM | 14px | 16px | `--text-sm` | 辅助文本、按钮 |
| XS | 12px | 14px | `--text-xs` | 注释、时间戳 |

**图标配对规则**: `图标尺寸 = 字号 × 1.25`（向上取整到偶数）

## 间距系统 (Spacing)

使用现有变量，禁止硬编码。

| 变量 | 值 | 变量 | 值 |
|------|-----|------|-----|
| `--space-1` | 4px | `--space-6` | 32px |
| `--space-2` | 8px | `--space-8` | 48px |
| `--space-3` | 12px | `--space-10` | 64px |
| `--space-4` | 16px | `--space-12` | 80px |
| `--space-5` | 24px | | |

## 组件尺寸 (Component Sizing)

| 尺寸 | 高度 | 字号 | 图标 | 头像 | 圆角 |
|------|------|------|------|------|------|
| XS | 24px | 12px | 14px | 20px | 4px |
| SM | 32px | 14px | 16px | 28px | 6px |
| **MD** | **40px** | **16px** | **20px** | **36px** | **8px** |
| LG | 48px | 21px | 24px | 48px | 10px |
| XL | 56px | 28px | 32px | 64px | 12px |

## 实施规则

1. **禁止硬编码**: 所有字号、间距、尺寸必须使用 CSS 变量
2. **图标一致性**: Lucide React 图标必须使用配对尺寸
3. **组件默认**: 未指定尺寸时使用 MD (40px 高度)

## 使用示例

```css
/* 正确 */
.button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  border-radius: 6px;
}

/* 错误 */
.button {
  padding: 8px 16px;    /* 硬编码 */
  font-size: 14px;      /* 硬编码 */
}
```

```tsx
// 正确 - 图标与字号配对
<span style={{ fontSize: 'var(--text-sm)' }}>
  <Bell size={16} /> {/* 14px 字号 × 1.25 ≈ 16px */}
</span>

// 错误 - 图标尺寸不匹配
<span style={{ fontSize: '14px' }}>
  <Bell size={24} /> {/* 尺寸不协调 */}
</span>
```
