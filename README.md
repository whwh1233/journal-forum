# 期刊论坛 - React版本

这是一个现代化的学术期刊评价与交流平台，使用React、TypeScript和Vite构建。

## 功能特性

### 期刊功能
- **搜索功能**: 按期刊名称、ISSN或学科领域搜索
- **筛选功能**: 按学科分类（计算机科学、生物学、物理学、化学、数学、医学）和评分（4星以上、3星以上、2星以上）筛选
- **期刊详情**: 点击期刊卡片查看详细信息和用户评价
- **响应式设计**: 支持桌面、平板和移动设备

### 用户认证
- **用户注册**: 邮箱注册，密码确认
- **用户登录**: 邮箱/密码登录
- **会话持久化**: 登录状态在页面刷新后保持
- **登出功能**: 安全退出账户

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router v6
- **状态管理**: Context API + useReducer + Custom Hooks
- **样式**: CSS Modules + 全局样式

## 项目结构

```
src/
├── components/          # 通用UI组件
├── features/            # 功能模块
│   ├── auth/           # 认证功能
│   └── journals/       # 期刊功能
├── contexts/            # 全局上下文
├── hooks/               # 自定义Hook
├── services/            # 服务层
├── utils/               # 工具函数
├── types/               # TypeScript类型
└── styles/              # 样式文件
```

## 安装和运行

### 前提条件
- Node.js 16+ 或更高版本
- npm 或 yarn 包管理器

### 安装依赖
```bash
npm install
# 或者
yarn install
```

### 开发模式
```bash
npm run dev
# 或者
yarn dev
```

应用将在 `http://localhost:3000` 启动并自动打开浏览器。

### 构建生产版本
```bash
npm run build
# 或者
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或者
yarn preview
```

## 数据说明

当前版本使用模拟数据，包含8个不同学科的期刊信息。所有数据存储在 `src/services/journalService.ts` 文件中。

认证系统也使用模拟实现，用户数据存储在浏览器的 localStorage 中。

## 扩展建议

1. **后端集成**: 连接真实的API后端
2. **数据库**: 使用MongoDB或PostgreSQL存储期刊和用户数据
3. **高级功能**:
   - 期刊投稿功能
   - 用户评论和评分
   - 期刊收藏功能
   - 邮件通知系统
4. **性能优化**:
   - 代码分割
   - 虚拟滚动列表
   - 缓存策略

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License