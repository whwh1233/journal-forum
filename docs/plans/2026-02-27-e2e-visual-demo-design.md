# E2E 可视化演示测试设计

## 概述

重新设计 E2E 自动化测试，实现：
- 可视化观看自动化测试操作浏览器
- 覆盖所有功能模块
- 完整流程演示 + 模块化测试双轨并行

## 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 测试范围 | 重新设计完整演示 | 替代现有部分功能测试，覆盖全部功能 |
| 测试账户 | 独立测试数据库 + 可视化种子 | 不影响生产数据，种子过程也可见 |
| 可视化效果 | 高亮 + 文字提示 | 元素红框高亮 + 右上角浮动提示 |
| 管理后台 | 包含 | 演示完整功能链 |
| 运行方式 | 混合式 | 完整流程 + 可单独运行的模块 |

## 文件结构

```
e2e/
├── tests/
│   ├── full-demo.spec.ts          # 完整流程演示（主入口）
│   ├── demo-modules/              # 模块化演示测试
│   │   ├── 01-guest.spec.ts       # 游客场景
│   │   ├── 02-auth.spec.ts        # 认证场景
│   │   ├── 03-user.spec.ts        # 用户场景
│   │   └── 04-admin.spec.ts       # 管理员场景
│   ├── user-flows.spec.ts         # 保留：用户流程测试
│   └── monkey.spec.ts             # 保留：随机测试
├── fixtures/
│   ├── test-data.ts               # 现有选择器和数据
│   └── demo-helpers.ts            # 新增：可视化辅助函数
└── demo.spec.ts                   # 删除（被 full-demo 替代）
```

## 可视化效果实现

### demo-helpers.ts

```typescript
import { Page } from '@playwright/test';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 元素高亮（红色边框）
async function highlight(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.outline = '3px solid #ff4444';
      el.style.outlineOffset = '2px';
      setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }, 1000);
    }
  }, selector);
}

// 浮动文字提示
async function showToast(page: Page, message: string, duration = 2000) {
  await page.evaluate(([msg, dur]) => {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 99999;
      background: rgba(0,0,0,0.85); color: #fff; padding: 12px 20px;
      border-radius: 8px; font-size: 16px; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), dur);
  }, [message, duration]);
}

// 组合：高亮 + 提示 + 延迟
async function demoAction(page: Page, selector: string, description: string) {
  await showToast(page, description);
  await highlight(page, selector);
  await delay(800);
}

export { delay, highlight, showToast, demoAction };
```

## 数据隔离

### 后端配置调整

```javascript
// backend/config/databaseLowdb.js
const dbFile = process.env.NODE_ENV === 'test'
  ? 'database.test.json'
  : 'database.json';
```

### Playwright 配置

```typescript
// playwright.config.ts
webServer: [
  {
    command: 'cd backend && cross-env NODE_ENV=test npm start',
    port: 3001,
  },
  // ...
],
```

### 种子数据（通过 UI 可视化创建）

演示开始时通过注册页面创建测试用户，全程可见：
- 演示用户：demo@example.com / Demo123456
- 管理员：admin@example.com / Admin123456

## 完整演示流程

### full-demo.spec.ts

```
第 1 幕：游客体验（约 2 分钟）
├─ 首页加载，展示期刊列表
├─ 滚动浏览期刊卡片
├─ 搜索期刊（输入关键词）
├─ 分类筛选（选择学科）
├─ 评分筛选
├─ 清除筛选
├─ 点击期刊查看详情面板
├─ 滚动查看详情内容
├─ 尝试评论 → 显示登录提示
└─ 关闭详情面板

第 2 幕：用户注册（约 1 分钟）
├─ 点击登录按钮，打开弹窗
├─ 切换到注册表单
├─ 填写用户名、邮箱、密码
├─ 提交注册
└─ 注册成功，自动登录

第 3 幕：用户功能（约 3 分钟）
├─ 查看期刊详情
├─ 发表评论 + 评分
├─ 收藏期刊
├─ 点击作者头像，关注用户
├─ 进入仪表盘，查看统计数据
├─ 查看收藏列表
├─ 查看关注/粉丝列表
├─ 进入个人资料编辑
├─ 修改头像、简介、机构等
├─ 保存资料
└─ 退出登录

第 4 幕：主题切换（约 1 分钟）
├─ 打开主题选择器
├─ 依次切换 6 个主题（每个停留展示）
└─ 切换深色/浅色模式

第 5 幕：管理后台（约 2 分钟）
├─ 管理员登录
├─ 进入管理后台首页
├─ 用户管理：查看用户列表
├─ 期刊管理：编辑期刊信息
├─ 评论管理：审核/删除评论
└─ 退出登录

预计总时长：约 9-10 分钟
```

## 模块化测试

### 01-guest.spec.ts
- 浏览期刊列表
- 搜索和筛选
- 查看期刊详情
- 主题切换

### 02-auth.spec.ts
- 用户注册流程
- 用户登录流程
- 表单验证提示

### 03-user.spec.ts（需登录）
- 发表评论和评分
- 收藏期刊
- 关注用户
- 仪表盘统计
- 编辑个人资料

### 04-admin.spec.ts（需管理员登录）
- 用户管理
- 期刊管理
- 评论审核

## 运行命令

```json
{
  "test:e2e:full-demo": "playwright test full-demo.spec.ts --headed",
  "test:e2e:demo:guest": "playwright test demo-modules/01-guest.spec.ts --headed",
  "test:e2e:demo:auth": "playwright test demo-modules/02-auth.spec.ts --headed",
  "test:e2e:demo:user": "playwright test demo-modules/03-user.spec.ts --headed",
  "test:e2e:demo:admin": "playwright test demo-modules/04-admin.spec.ts --headed",
  "test:e2e:demo:all": "playwright test demo-modules --headed"
}
```

## 实施要点

1. **数据隔离优先** - 确保 NODE_ENV=test 时使用 database.test.json
2. **可视化全程** - 所有操作包括数据准备都要有提示和高亮
3. **删除旧文件** - 移除 demo.spec.ts，避免混淆
4. **保留现有测试** - user-flows.spec.ts 和 monkey.spec.ts 保留
