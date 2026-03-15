---
name: project-conventions
description: Enforces project conventions for the journal-forum (pubWhere) project. Use this skill whenever starting dev servers, running the app, creating frontend components, doing any UI work, or writing tests. Triggers on service startup, port configuration, component creation, UI development, styling, frontend feature work, and test writing.
---

## Port Configuration (Non-Negotiable)

The project uses fixed ports that must never be changed under any circumstances:

| Service | Port |
|---------|------|
| Frontend (Vite) | **3000** |
| Backend (Express) | **3001** |

These ports are hardcoded across CORS config, proxy settings, environment variables, API calls, and test configurations. Changing them breaks the entire stack.

When starting services:
- Frontend: `npm run dev` (Vite is configured to use port 3000)
- Backend: `cd backend && npm start` (Express listens on port 3001)

If a port conflict occurs, **kill the conflicting process** instead of changing the port:
```bash
netstat -ano | findstr :3000
taskkill /PID <pid> /F

netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

Never pass `--port` flags, never modify vite.config port settings, never change the PORT environment variable. The ports are 3000 and 3001. No exceptions.

## Frontend Component Creation

When creating any frontend component, you MUST invoke the `ui-ux-pro-max:ui-ux-pro-max` skill first. This ensures components follow professional UI/UX standards and integrate with the project's design system.

### Project Design System

Read `docs/design-system.md` before creating components. Key rules:

- **Fonts**: Lexend (body text) / JetBrains Mono (code)
- **Font sizes**: Perfect Fourth ratio (12px ~ 50px)
- **Component sizes**: XS/SM/MD/LG/XL, default MD (40px)
- **Colors**: CSS variables only - never hardcode colors, spacing, or font sizes
- **Icons**: Lucide React exclusively
- **Styling**: CSS variables for all design tokens

### Component Creation Workflow

1. Invoke `ui-ux-pro-max:ui-ux-pro-max` skill for design guidance
2. Read `docs/design-system.md` for project-specific tokens
3. Use existing CSS variables from the design system
4. Follow established patterns in `src/features/` and `src/components/`

## Multi-Theme Verification (Non-Negotiable)

Any UI change must be verified under **all themes** before presenting to the user. Do not let the user discover theme-specific issues themselves.

### Rules

- After any CSS or component change, check that all color values come from CSS variables (not hardcoded hex/rgb/rgba)
- Read `THEMES.md` and the theme CSS files to confirm referenced variables exist across all themes
- If creating a preview/comparison page, test switching themes to verify no broken colors, missing variables, or unreadable contrast
- **Never use hardcoded colors** such as `#dc3545`, `rgba(220,53,69,...)`, `#fff` — always use `var(--color-*)` tokens
- When fixing hardcoded colors, map them to the correct semantic variable (e.g. error red → `var(--color-error)`, white text → `var(--color-text-inverse)`)

### Checklist (run mentally before showing any UI change)

1. All color/background/border/shadow values use CSS variables
2. Variables referenced actually exist in every theme file
3. Contrast is readable in both light and dark themes
4. No visual artifacts (invisible text, missing borders) in any theme

## Testing Standards (Non-Negotiable)

Every个功能必须覆盖完整的三层测试，缺一不可：

### 测试层级

| 层级 | 工具 | 目录 | 说明 |
|------|------|------|------|
| **后端测试** | Jest | `backend/__tests__/unit/` + `backend/__tests__/integration/` | 纯函数单元测试 + API 集成测试 |
| **前端测试** | Vitest | `src/__tests__/` | 组件渲染、交互、状态管理测试 |
| **E2E 测试** | Playwright | `e2e/tests/` | 用户视角的端到端全链路测试 |

### 测试要求

1. **后端单元测试**：所有纯函数（工具函数、计算逻辑）必须有独立单元测试
2. **后端集成测试**：所有 API 端点必须测试请求→数据库状态变化→响应的完整链路
3. **前端组件测试**：所有用户可交互的组件必须测试渲染、事件触发和状态更新
4. **E2E 测试**：每个用户可见的功能模块必须有端到端测试，验证前后端联动的完整流程

### 运行命令

```bash
npm test                    # 前端 Vitest
cd backend && npm test      # 后端 Jest
npm run test:e2e            # Playwright E2E
```

### 测试编写原则

- 测试文件命名与源文件对应（如 `hotScore.js` → `hotScore.test.js`）
- 集成测试使用真实数据库，不 mock 数据库层
- E2E 测试模拟真实用户操作流程，不依赖内部实现细节
- 每个测试用例只验证一个行为点
