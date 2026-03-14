# 图片上传功能设计

> 日期: 2026-03-14
> 状态: 已批准

## 概述

为社区帖子、帖子评论、期刊评论三处添加图片上传能力。用户可在编辑内容时上传图片，图片以 Markdown 格式内联在内容中，支持图文混排。

## 需求

- **上传点**: PostForm（帖子）、PostCommentForm（帖子评论）、CommentForm（期刊评论）
- **存储**: 本地磁盘，抽象存储层接口，预留云存储迁移能力
- **限制**: 单张上传，最大 5MB，支持 JPEG/PNG/GIF/WebP
- **上传时机**: 选择图片后立即上传，返回 URL 插入 Markdown
- **编辑器**: 统一使用 Markdown，评论从 textarea 升级为轻量 Markdown 编辑器
- **展示**: 保持用户上传原图样式，Markdown 渲染内联显示，点击可放大

## 架构设计

### 存储层

抽象 `StorageService` 接口，当前实现为本地磁盘存储，后续可替换为云存储（OSS/S3）。

```
backend/services/
  storageService.js        # 接口定义 + 工厂函数
  localStorage.js          # 本地磁盘实现（默认）
  # 未来: ossStorage.js / s3Storage.js
```

**StorageService 接口:**

```javascript
class StorageService {
  async upload(file, options) → { url, filename }
  async delete(filename) → boolean
  getUrl(filename) → string
}
```

**本地存储实现:**

- 存储目录: `backend/uploads/images/`
- 文件命名: `{userId}-{timestamp}-{random}.{ext}`
- 静态文件服务: 复用已有的 `app.use('/uploads', express.static('uploads'))`

### API 设计

**新增路由:**

```
POST /api/uploads/image
  - 认证: 需要 Bearer token
  - Body: multipart/form-data, field 名为 "image"
  - 验证: 文件类型 (jpeg/jpg/png/gif/webp), 大小 ≤ 5MB
  - 响应: { success: true, data: { url: "/uploads/images/xxx.jpg" } }
  - 错误: 400 (无文件/类型不对/超大小), 401 (未登录)
```

**文件结构:**

```
backend/
  routes/uploadRoutes.js         # 上传路由
  controllers/uploadController.js # 上传控制器
  services/storageService.js      # 存储接口 + 工厂
  services/localStorage.js        # 本地存储实现
```

### 前端组件设计

抽取共享 Markdown 编辑器组件，供帖子和评论复用：

```
src/components/MarkdownEditor/
  MarkdownEditor.tsx        # 核心编辑器组件
  ImageUploadButton.tsx     # 图片上传按钮
  MarkdownPreview.tsx       # Markdown 渲染预览
  MarkdownEditor.css        # 样式
```

**MarkdownEditor 组件 Props:**

```typescript
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: 'full' | 'compact';   // full=帖子, compact=评论
  minHeight?: string;
  maxHeight?: string;
}
```

- **full 模式**: 完整 toolbar — 粗体、斜体、标题、代码、引用、列表、链接、图片上传、预览切换
- **compact 模式**: 精简 toolbar — 粗体、斜体、图片上传，无标题/代码块等

**ImageUploadButton 组件:**

1. 用户点击按钮 → 触发隐藏的 `<input type="file">`
2. 选择文件 → 显示上传中状态
3. 调用 `POST /api/uploads/image` 上传
4. 上传成功 → 在光标位置插入 `![image](url)`
5. 上传失败 → 显示错误提示

### 编辑器改造

**PostForm (帖子):**

- 用 MarkdownEditor(mode="full") 替换现有的 textarea + 自定义 toolbar
- 图片按钮从插入语法模板改为触发实际上传
- 保留现有的 编辑/预览/分屏 切换功能

**PostCommentForm (帖子评论):**

- 用 MarkdownEditor(mode="compact") 替换现有 textarea
- 新增图片上传能力
- 保持回复/取消等现有交互

**CommentForm (期刊评论):**

- 用 MarkdownEditor(mode="compact") 替换现有 textarea
- 新增图片上传能力
- 保留评分维度输入（DimensionRatingInput）不变

### 评论渲染改造

当前评论以纯文本渲染，需改为 Markdown 渲染：

- 复用 MarkdownPreview 组件渲染评论内容
- 图片在内容流中内联显示
- 图片点击可放大查看（Lightbox 效果）
- 需要对 Markdown 渲染做安全处理（XSS 防护，限制允许的 HTML 标签）

### 图片展示

- 内联图片最大宽度 100%，自适应容器
- 评论中的图片添加适当的 max-height 限制，避免过长评论
- 点击图片弹出 Lightbox 查看原图
- 图片加载失败显示占位符

## 安全考虑

- **文件类型双重校验**: multer fileFilter 检查扩展名 + MIME type（MIME 可被伪造，需同时校验扩展名）
- **文件大小限制**: multer limits 设为 5MB
- **文件名安全**: 不使用原始文件名，生成随机文件名
- **上传频率限制**: 上传接口独立限流，每用户每分钟最多 10 次上传，防止滥用耗尽磁盘
- **Markdown 渲染 XSS 防护**: 使用 rehype-sanitize 过滤危险标签
- **Helmet CSP 配置**: 确保 `img-src` 允许 `'self'`，使 `/uploads/images/` 下的图片可正常加载
- 仅登录用户可上传

## 孤立图片处理

用户上传图片后可能未提交内容，产生孤立文件。当前阶段标记为 **已知问题，暂不处理**，原因：
- 初期上传量不大，磁盘空间压力低
- 清理逻辑需扫描所有帖子/评论内容匹配 URL，复杂度较高

后续可添加定时清理任务：扫描 `uploads/images/` 中超过 24 小时且未被任何内容引用的文件。

## 目录创建

`localStorage.js` 初始化时需检查并自动创建 `backend/uploads/images/` 目录（参照现有头像上传中 `uploads/avatars/` 的处理方式）。

## 上传交互细节

- 上传中：图片按钮显示 spinner，编辑器中光标处插入占位符 `![上传中...]()`
- 上传成功：占位符替换为 `![image](url)`
- 上传失败：移除占位符，显示 toast 错误提示
- 上传期间禁用提交按钮，防止提交包含占位符的内容

## 影响范围

### 新增文件
- `backend/services/storageService.js`
- `backend/services/localStorage.js`
- `backend/routes/uploadRoutes.js`
- `backend/controllers/uploadController.js`
- `src/components/MarkdownEditor/MarkdownEditor.tsx`
- `src/components/MarkdownEditor/ImageUploadButton.tsx`
- `src/components/MarkdownEditor/MarkdownPreview.tsx`
- `src/components/MarkdownEditor/MarkdownEditor.css`

### 修改文件
- `backend/server.js` — 注册上传路由，确认 Helmet CSP 配置
- `src/features/posts/components/PostForm.tsx` — 使用 MarkdownEditor(mode="full")
- `src/features/posts/components/PostCommentForm.tsx` — 升级为 MarkdownEditor(mode="compact")
- `src/features/comments/components/CommentForm.tsx` — 升级为 MarkdownEditor(mode="compact")
- `src/features/comments/components/CommentItem.tsx` — 从纯文本渲染改为 Markdown 渲染，编辑模式也升级为 MarkdownEditor
- `src/features/posts/components/PostCommentItem.tsx` — 从纯文本渲染改为 Markdown 渲染

### 新增依赖（如需要）
- 图片 Lightbox 库（或自行实现简单版本）
- 注：react-markdown、remark-gfm、rehype-highlight 等 Markdown 渲染依赖项目中已有

## 未来增强（Out of Scope）

- 剪贴板粘贴图片（Ctrl+V）
- 拖拽上传图片
- 服务端图片压缩/缩放（sharp）
- 孤立图片自动清理
- 云存储迁移（OSS/S3）
