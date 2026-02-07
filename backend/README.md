# Journal Forum Backend

后端服务为Journal Forum前端应用提供API支持，包括用户认证和期刊管理功能。

## 技术栈

- **Node.js** + **Express**: Web框架
- **MongoDB**: NoSQL数据库
- **Mongoose**: MongoDB对象建模
- **JWT**: 用户认证
- **Bcrypt**: 密码加密
- **Helmet**: 安全头部
- **CORS**: 跨域资源共享
- **Rate Limiting**: 请求频率限制

## 功能特性

### 用户认证
- ✅ 用户注册（邮箱验证）
- ✅ 用户登录（JWT token）
- ✅ 会话管理
- ✅ 密码加密存储

### 期刊管理
- ✅ 期刊列表获取（支持分页）
- ✅ 期刊搜索（标题、ISSN、学科）
- ✅ 期刊筛选（学科分类、评分）
- ✅ 期刊详情查看
- ✅ 用户评论和评分

### 安全特性
- 🔒 密码加密（bcrypt）
- 🔒 JWT认证
- 🔒 HTTPS安全头部（Helmet）
- 🔒 请求频率限制
- 🔒 输入验证和清理

## API端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 期刊相关
- `GET /api/journals` - 获取期刊列表（支持查询参数）
- `GET /api/journals/:id` - 获取期刊详情
- `POST /api/journals/:id/reviews` - 添加期刊评论

## 环境变量

创建 `.env` 文件并配置以下变量：

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/journal-forum
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

## 安装和运行

### 前提条件
- Node.js 16+
- MongoDB 本地实例或云服务

### 安装依赖
```bash
cd backend
npm install
```

### 初始化数据库（可选）
```bash
npm run init-db
```

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

## API使用示例

### 用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'
```

### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### 获取期刊列表
```bash
curl -X GET "http://localhost:3001/api/journals?search=计算机&category=computer-science&minRating=4"
```

## 前端集成

前端应用需要配置环境变量来连接后端：

```env
# .env.local (frontend)
VITE_API_URL=http://localhost:3001
```

然后更新前端的 `authService.ts` 和 `journalService.ts` 文件以调用真实API。

## 测试

```bash
npm test
```

## 部署

推荐部署方案：
- **MongoDB**: MongoDB Atlas (云服务)
- **Backend**: Heroku, Render, or AWS Elastic Beanstalk
- **Frontend**: Netlify, Vercel, or AWS S3 + CloudFront

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License