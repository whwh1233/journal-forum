# 图片上传功能 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为帖子、帖子评论、期刊评论三处添加图片上传能力，统一使用 Markdown 编辑器

**Architecture:** 后端抽象存储层 + 独立上传 API，前端抽取共享 MarkdownEditor 组件（full/compact 两种模式），评论渲染从纯文本升级为 Markdown 渲染

**Tech Stack:** multer (已有), express-rate-limit (已有), react-markdown (已有), remark-gfm (已有), rehype-highlight (已有), rehype-sanitize (需安装), Lucide React icons (已有)

**注意事项:**
- 与 spec 的偏差：`minHeight` 改为 `minRows`（更适合 textarea），`ImageUploadButton.tsx` 和 `MarkdownPreview.tsx` 合并进 `MarkdownEditor.tsx`，新增 `MarkdownContent.tsx` 用于评论渲染
- 上传服务使用 axios（与项目现有服务保持一致）
- 需要安装 `rehype-sanitize` 用于 Markdown XSS 防护

**Spec:** `docs/superpowers/specs/2026-03-14-image-upload-design.md`

---

## Chunk 1: 后端存储层 + 上传 API

### Task 1: 存储服务抽象层

**Files:**
- Create: `backend/services/storageService.js`
- Create: `backend/services/localStorage.js`

- [ ] **Step 1: Create storageService.js — 接口定义 + 工厂函数**

```javascript
// backend/services/storageService.js
const LocalStorage = require('./localStorage');

class StorageService {
  async upload(file, options = {}) {
    throw new Error('Not implemented');
  }
  async delete(filename) {
    throw new Error('Not implemented');
  }
  getUrl(filename) {
    throw new Error('Not implemented');
  }
}

function createStorageService() {
  const type = process.env.STORAGE_TYPE || 'local';
  switch (type) {
    case 'local':
    default:
      return new LocalStorage();
  }
}

const storageService = createStorageService();

module.exports = { StorageService, storageService };
```

- [ ] **Step 2: Create localStorage.js — 本地磁盘实现**

```javascript
// backend/services/localStorage.js
const path = require('path');
const fs = require('fs');
const { StorageService } = require('./storageService');

class LocalStorage extends StorageService {
  constructor() {
    super();
    this.uploadDir = path.join(__dirname, '..', 'uploads', 'images');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file, options = {}) {
    // multer 已将文件写入磁盘，此处仅返回信息
    const filename = file.filename;
    const url = `/uploads/images/${filename}`;
    return { url, filename };
  }

  async delete(filename) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  getUrl(filename) {
    return `/uploads/images/${filename}`;
  }
}

module.exports = LocalStorage;
```

注意：`localStorage.js` 和 `storageService.js` 有循环引用。解决方案是在 `storageService.js` 中延迟 require：

```javascript
// storageService.js 修正版 — createStorageService 内 require
function createStorageService() {
  const type = process.env.STORAGE_TYPE || 'local';
  switch (type) {
    case 'local':
    default:
      const LocalStorage = require('./localStorage');
      return new LocalStorage();
  }
}
```

同时 `localStorage.js` 不继承 StorageService class，改为独立实现：

```javascript
// localStorage.js 修正版 — 不 require storageService
class LocalStorage {
  constructor() { /* ... */ }
  async upload(file, options = {}) { /* ... */ }
  async delete(filename) { /* ... */ }
  getUrl(filename) { /* ... */ }
}
module.exports = LocalStorage;
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/storageService.js backend/services/localStorage.js
git commit -m "feat(upload): add storage service abstraction layer"
```

---

### Task 2: 上传控制器 + 路由

**Files:**
- Create: `backend/controllers/uploadController.js`
- Create: `backend/routes/uploadRoutes.js`
- Modify: `backend/server.js:7-19` (添加路由导入和注册)

- [ ] **Step 1: Create uploadController.js**

```javascript
// backend/controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storageService } = require('../services/storageService');

// multer 配置
const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const allowedTypes = /jpeg|jpg|png|gif|webp/;

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
});

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    const { url, filename } = await storageService.upload(req.file);

    res.status(200).json({
      success: true,
      data: { url, filename }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败'
    });
  }
};

module.exports = {
  upload,
  uploadImage
};
```

- [ ] **Step 2: Create uploadRoutes.js**

```javascript
// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { upload, uploadImage } = require('../controllers/uploadController');

// 上传专用限流：每用户每分钟最多 10 次
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    message: '上传过于频繁，请稍后再试'
  }
});

// 用包装函数捕获 multer 错误（4 参数错误中间件在 router.post 中不生效）
router.post(
  '/image',
  protect,
  uploadLimiter,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: '图片大小不能超过 5MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || '上传失败'
        });
      }
      next();
    });
  },
  uploadImage
);

module.exports = router;
```

- [ ] **Step 3: Register route in server.js**

在 `backend/server.js` 中：

1. 添加导入（约第 20 行，在其他路由导入后）：
```javascript
const uploadRoutes = require('./routes/uploadRoutes');
```

2. 注册路由（约第 129 行，在其他 API 路由后）：
```javascript
app.use('/api/uploads', uploadRoutes);
```

3. Helmet CSP：默认 `helmet()` 的 `img-src` 已包含 `'self'`，同源的 `/uploads/images/` 路径可正常加载。如果测试时图片被 CSP 阻止，则需要显式配置：
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:']
    }
  }
}));
```

- [ ] **Step 4: 手动测试上传 API**

```bash
# 启动后端
cd backend && npm start

# 用 curl 测试（需要有效 token）
curl -X POST http://localhost:3001/api/uploads/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@test-image.jpg"

# 预期响应:
# { "success": true, "data": { "url": "/uploads/images/img-xxx.jpg", "filename": "img-xxx.jpg" } }
```

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/uploadController.js backend/routes/uploadRoutes.js backend/server.js
git commit -m "feat(upload): add image upload API with rate limiting"
```

---

## Chunk 2: 前端上传服务 + MarkdownEditor 组件

### Task 3: 安装依赖 + 前端上传服务

- [ ] **Step 0: 安装 rehype-sanitize**

```bash
npm install rehype-sanitize
```

预期：package.json 中新增 `rehype-sanitize` 依赖。

- [ ] **Step 0.5: 确认 uploads/images 在 .gitignore 中**

检查 `backend/.gitignore` 或根目录 `.gitignore`，确保 `uploads/images/` 不会被提交。如需要添加：
```
# 在 .gitignore 中
backend/uploads/images/
```

**Files:**
- Create: `src/services/uploadService.ts`

- [ ] **Step 1: Create uploadService.ts**

```typescript
// src/services/uploadService.ts
import axios from 'axios';

export interface UploadResult {
  url: string;
  filename: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post('/api/uploads/image', formData, {
    headers: {
      Authorization: `Bearer ${token}`
      // 不设置 Content-Type，让 axios 自动设置 multipart boundary
    }
  });

  return response.data.data;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/uploadService.ts
git commit -m "feat(upload): add frontend upload service"
```

---

### Task 4: MarkdownEditor 共享组件

**Files:**
- Create: `src/components/MarkdownEditor/MarkdownEditor.tsx`
- Create: `src/components/MarkdownEditor/MarkdownEditor.css`
- Create: `src/components/MarkdownEditor/index.ts`

- [ ] **Step 1: Create MarkdownEditor.tsx**

核心编辑器组件，支持 `full` 和 `compact` 两种模式。

```tsx
// src/components/MarkdownEditor/MarkdownEditor.tsx
import React, { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import {
  Bold, Italic, Code, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon,
  Quote, Heading, Eye, Edit3, Columns
} from 'lucide-react';
import { uploadImage } from '../../services/uploadService';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode?: 'full' | 'compact';
  minRows?: number;
  maxHeight?: string;
  disabled?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '输入内容...',
  mode = 'full',
  minRows = 4,
  maxHeight,
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value); // 用 ref 跟踪最新 value，避免 async 闭包过期
  valueRef.current = value;
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>(
    mode === 'full' ? 'split' : 'edit'
  );

  // 在光标位置插入 Markdown 语法
  const insertMarkdown = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = valueRef.current.substring(start, end) || placeholder;
    const newText = valueRef.current.substring(0, start) + before + selectedText + after + valueRef.current.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  }, [onChange]);

  // 图片上传处理 — 使用 valueRef 避免闭包过期问题
  const handleImageUpload = useCallback(async (file: File) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;

    // 插入上传占位符
    const placeholderText = '![上传中...]()';
    const currentVal = valueRef.current;
    const newText = currentVal.substring(0, start) + placeholderText + currentVal.substring(start);
    onChange(newText);

    setIsUploading(true);

    try {
      const result = await uploadImage(file);
      // 从 ref 读取最新值，替换占位符（用户可能在上传期间继续编辑）
      const latestValue = valueRef.current;
      const finalText = latestValue.replace(placeholderText, `![image](${result.url})`);
      onChange(finalText);
    } catch (error: any) {
      // 移除占位符
      const latestValue = valueRef.current;
      onChange(latestValue.replace(placeholderText, ''));
      alert(error.message || '图片上传失败');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
  }, [handleImageUpload]);

  // full 模式的完整工具栏
  const fullToolbar = [
    { icon: <Bold size={16} />, label: '粗体', action: () => insertMarkdown('**', '**', '粗体文字') },
    { icon: <Italic size={16} />, label: '斜体', action: () => insertMarkdown('*', '*', '斜体文字') },
    { icon: <Heading size={16} />, label: '标题', action: () => insertMarkdown('## ', '', '标题') },
    { icon: <Code size={16} />, label: '代码', action: () => insertMarkdown('`', '`', '代码') },
    { icon: <Quote size={16} />, label: '引用', action: () => insertMarkdown('> ', '', '引用内容') },
    { icon: <List size={16} />, label: '无序列表', action: () => insertMarkdown('- ', '', '列表项') },
    { icon: <ListOrdered size={16} />, label: '有序列表', action: () => insertMarkdown('1. ', '', '列表项') },
    { icon: <LinkIcon size={16} />, label: '链接', action: () => insertMarkdown('[', '](url)', '链接文字') },
    { icon: <ImageIcon size={16} />, label: '上传图片', action: handleFileSelect, isUpload: true },
  ];

  // compact 模式的精简工具栏
  const compactToolbar = [
    { icon: <Bold size={16} />, label: '粗体', action: () => insertMarkdown('**', '**', '粗体文字') },
    { icon: <Italic size={16} />, label: '斜体', action: () => insertMarkdown('*', '*', '斜体文字') },
    { icon: <ImageIcon size={16} />, label: '上传图片', action: handleFileSelect, isUpload: true },
  ];

  const toolbar = mode === 'full' ? fullToolbar : compactToolbar;

  return (
    <div className={`markdown-editor markdown-editor--${mode}`}>
      <div className="markdown-editor__toolbar">
        <div className="markdown-editor__toolbar-buttons">
          {toolbar.map((btn, i) => (
            <button
              key={i}
              type="button"
              className={`markdown-editor__toolbar-btn ${btn.isUpload && isUploading ? 'uploading' : ''}`}
              onClick={btn.action}
              title={btn.label}
              disabled={disabled || (btn.isUpload && isUploading)}
            >
              {btn.isUpload && isUploading ? (
                <span className="markdown-editor__spinner" />
              ) : (
                btn.icon
              )}
            </button>
          ))}
        </div>

        {mode === 'full' && (
          <div className="markdown-editor__view-toggle">
            <button
              type="button"
              className={`markdown-editor__view-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
              title="编辑"
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              className={`markdown-editor__view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="分屏"
            >
              <Columns size={16} />
            </button>
            <button
              type="button"
              className={`markdown-editor__view-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="预览"
            >
              <Eye size={16} />
            </button>
          </div>
        )}
      </div>

      <div className={`markdown-editor__body markdown-editor__body--${viewMode}`}>
        {viewMode !== 'preview' && (
          <textarea
            ref={textareaRef}
            className="markdown-editor__textarea"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={minRows}
            style={maxHeight ? { maxHeight } : undefined}
            disabled={disabled || isUploading}
          />
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="markdown-editor__preview markdown-content">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeSanitize]}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="markdown-editor__preview-placeholder">预览区域</p>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MarkdownEditor;
```

- [ ] **Step 2: Create MarkdownEditor.css**

使用 CSS 变量，遵循项目设计系统。

```css
/* src/components/MarkdownEditor/MarkdownEditor.css */
.markdown-editor {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: var(--bg-primary);
}

.markdown-editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  flex-wrap: wrap;
  gap: 2px;
}

.markdown-editor__toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.markdown-editor__toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.markdown-editor__toolbar-btn:hover {
  background: var(--bg-tertiary, var(--bg-hover));
  color: var(--text-primary);
}

.markdown-editor__toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.markdown-editor__toolbar-btn.uploading {
  color: var(--color-primary);
}

.markdown-editor__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: md-editor-spin 0.6s linear infinite;
}

@keyframes md-editor-spin {
  to { transform: rotate(360deg); }
}

.markdown-editor__view-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
}

.markdown-editor__view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.markdown-editor__view-btn:hover {
  color: var(--text-primary);
}

.markdown-editor__view-btn.active {
  color: var(--color-primary);
  background: var(--bg-tertiary, var(--bg-hover));
}

/* Body layouts */
.markdown-editor__body {
  display: flex;
}

.markdown-editor__body--edit .markdown-editor__textarea {
  width: 100%;
}

.markdown-editor__body--split {
  display: flex;
}

.markdown-editor__body--split .markdown-editor__textarea,
.markdown-editor__body--split .markdown-editor__preview {
  width: 50%;
}

.markdown-editor__body--split .markdown-editor__preview {
  border-left: 1px solid var(--border-primary);
}

.markdown-editor__body--preview .markdown-editor__preview {
  width: 100%;
}

.markdown-editor__textarea {
  width: 100%;
  padding: 12px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: inherit;
  font-size: var(--font-size-sm, 14px);
  line-height: 1.6;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.markdown-editor__textarea::placeholder {
  color: var(--text-tertiary);
}

.markdown-editor__preview {
  padding: 12px;
  overflow-y: auto;
  font-size: var(--font-size-sm, 14px);
  line-height: 1.6;
  color: var(--text-primary);
}

.markdown-editor__preview img {
  max-width: 100%;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
}

.markdown-editor__preview-placeholder {
  color: var(--text-tertiary);
  font-style: italic;
}

/* Compact mode adjustments */
.markdown-editor--compact .markdown-editor__toolbar {
  padding: 2px 6px;
}

.markdown-editor--compact .markdown-editor__toolbar-btn {
  width: 28px;
  height: 28px;
}

.markdown-editor--compact .markdown-editor__textarea {
  padding: 8px 12px;
}
```

- [ ] **Step 3: Create index.ts 导出**

```typescript
// src/components/MarkdownEditor/index.ts
export { default as MarkdownEditor } from './MarkdownEditor';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MarkdownEditor/
git commit -m "feat(editor): add shared MarkdownEditor component with image upload"
```

---

## Chunk 3: 集成到三个编辑表单

### Task 5: PostForm 集成 MarkdownEditor

**Files:**
- Modify: `src/features/posts/components/PostForm.tsx`

PostForm 已有自己的 markdown toolbar 和 textarea。需要替换为 MarkdownEditor 组件。

- [ ] **Step 1: 替换 PostForm 中的编辑器部分**

主要改动：
1. 移除 PostForm 内部的 `insertMarkdown` 函数、`toolbarButtons` 数组、`textareaRef`
2. 移除 ReactMarkdown, remarkGfm, rehypeHighlight 的 import（MarkdownEditor 内部已引入）
3. 移除 Bold, Italic, Code 等 toolbar 图标的 import（MarkdownEditor 内部已引入）
4. 移除 `viewMode` state（MarkdownEditor 内部管理）
5. 用 `<MarkdownEditor mode="full" value={content} onChange={setContent} />` 替换 toolbar + textarea + preview 区域
6. 保留 PostForm 的标题、分类、标签、草稿等逻辑不变

具体替换区域：
- 删除 import 的 Markdown 相关和图标（第 2-4 行、第 6-18 行中的图标）— 保留 X, Save, Send, AlertCircle, CheckCircle
- 删除 `viewMode` state（约第 50 行）
- 删除 `textareaRef`（约第 55 行）
- 删除 `insertMarkdown` 函数（第 122-141 行）
- 删除 `toolbarButtons` 数组（第 143-189 行）
- 添加 `import { MarkdownEditor } from '../../../components/MarkdownEditor';`
- 在 JSX 中将 toolbar div + textarea + preview 区域替换为 `<MarkdownEditor>`

- [ ] **Step 2: 验证 PostForm 功能正常**

启动前端 `npm run dev`，访问创建帖子页面，确认：
- MarkdownEditor 显示完整 toolbar
- 图片上传按钮可用
- 分屏预览正常
- 草稿保存正常
- 提交帖子正常

- [ ] **Step 3: Commit**

```bash
git add src/features/posts/components/PostForm.tsx
git commit -m "refactor(posts): replace PostForm editor with shared MarkdownEditor"
```

---

### Task 6: PostCommentForm 升级为 MarkdownEditor

**Files:**
- Modify: `src/features/posts/components/PostCommentForm.tsx`

当前是简单 textarea，需要升级为 MarkdownEditor(mode="compact")。

- [ ] **Step 1: 替换 PostCommentForm 的 textarea**

```tsx
// src/features/posts/components/PostCommentForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { MarkdownEditor } from '../../../components/MarkdownEditor';
import './PostCommentForm.css';

interface PostCommentFormProps {
  postId: number;
  parentId?: number | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

const PostCommentForm: React.FC<PostCommentFormProps> = ({
  postId,
  parentId = null,
  onCommentAdded,
  onCancel,
  isReply = false
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('请输入评论内容');
      return;
    }

    if (!user) {
      alert('请先登录');
      return;
    }

    setIsSubmitting(true);

    try {
      const { postService } = await import('../services/postService');

      await postService.createComment(postId, {
        content: content.trim(),
        parentId: parentId || undefined
      });

      setContent('');
      onCommentAdded();

      if (onCancel) {
        onCancel();
      }
    } catch (error: any) {
      console.error('Error creating comment:', error);
      alert(error.message || '发表评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="post-comment-form-login-prompt">
        请先登录后发表{isReply ? '回复' : '评论'}
      </div>
    );
  }

  return (
    <form className="post-comment-form" onSubmit={handleSubmit}>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder={isReply ? '写下你的回复...' : '写下你的评论...'}
        mode="compact"
        minRows={isReply ? 3 : 4}
        disabled={isSubmitting}
      />

      <div className="post-comment-form-actions">
        {onCancel && (
          <button
            type="button"
            className="post-comment-form-btn post-comment-form-btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="post-comment-form-btn post-comment-form-btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '发布中...' : isReply ? '回复' : '发表评论'}
        </button>
      </div>
    </form>
  );
};

export default PostCommentForm;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/posts/components/PostCommentForm.tsx
git commit -m "feat(posts): upgrade PostCommentForm with MarkdownEditor"
```

---

### Task 7: CommentForm (期刊评论) 升级为 MarkdownEditor

**Files:**
- Modify: `src/features/comments/components/CommentForm.tsx`

和 PostCommentForm 类似，将 textarea 替换为 MarkdownEditor(mode="compact")，保留 DimensionRatingInput 不变。

- [ ] **Step 1: 替换 CommentForm 的 textarea**

```tsx
// src/features/comments/components/CommentForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { MarkdownEditor } from '../../../components/MarkdownEditor';
import DimensionRatingInput from './DimensionRatingInput';
import type { DimensionRatings } from '../../../types';
import './CommentForm.css';

// ... 接口定义和组件 props 保持不变 ...

// 在 JSX 中，将 textarea 替换为：
<MarkdownEditor
  value={content}
  onChange={setContent}
  placeholder={isReply ? '写下你的回复...' : '写下你的评论...'}
  mode="compact"
  minRows={isReply ? 3 : 4}
  disabled={isSubmitting}
/>

// DimensionRatingInput 保持在 MarkdownEditor 上方，不变
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/CommentForm.tsx
git commit -m "feat(comments): upgrade CommentForm with MarkdownEditor"
```

---

## Chunk 4: 评论渲染 Markdown 化 + 图片展示

### Task 8: MarkdownContent 渲染组件

**Files:**
- Create: `src/components/MarkdownEditor/MarkdownContent.tsx`
- Update: `src/components/MarkdownEditor/index.ts`

创建一个轻量渲染组件，用于评论内容的 Markdown 渲染（区别于编辑器内的预览）。

- [ ] **Step 1: Create MarkdownContent.tsx**

```tsx
// src/components/MarkdownEditor/MarkdownContent.tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          components={{
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt || 'image'}
                {...props}
                style={{ maxWidth: '100%', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => src && setLightboxSrc(src)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.insertAdjacentHTML('afterend',
                    '<span class="markdown-img-error">图片加载失败</span>');
                }}
                loading="lazy"
              />
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {lightboxSrc && (
        <div
          className="markdown-lightbox"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="enlarged" />
        </div>
      )}
    </>
  );
};

export default MarkdownContent;
```

- [ ] **Step 2: 在 MarkdownEditor.css 中添加 Lightbox 样式**

```css
/* 添加到 MarkdownEditor.css 末尾 */

/* Lightbox */
.markdown-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  cursor: pointer;
  animation: md-lightbox-in 0.2s ease;
}

.markdown-lightbox img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
}

@keyframes md-lightbox-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Markdown content in comments */
.markdown-content {
  line-height: 1.6;
  word-break: break-word;
}

.markdown-content p {
  margin: 0 0 0.5em;
}

.markdown-content p:last-child {
  margin-bottom: 0;
}

.markdown-content img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: var(--radius-sm, 4px);
  margin: 4px 0;
  cursor: pointer;
}

.markdown-img-error {
  display: inline-block;
  padding: 8px 12px;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs, 12px);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm, 4px);
}

.markdown-content code {
  padding: 2px 4px;
  border-radius: 3px;
  background: var(--bg-tertiary, var(--bg-secondary));
  font-size: 0.9em;
}

.markdown-content pre code {
  display: block;
  padding: 12px;
  overflow-x: auto;
}

.markdown-content blockquote {
  margin: 0.5em 0;
  padding-left: 12px;
  border-left: 3px solid var(--border-primary);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Update index.ts 导出**

```typescript
// src/components/MarkdownEditor/index.ts
export { default as MarkdownEditor } from './MarkdownEditor';
export { default as MarkdownContent } from './MarkdownContent';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MarkdownEditor/
git commit -m "feat(editor): add MarkdownContent component with lightbox"
```

---

### Task 9: CommentItem 渲染升级

**Files:**
- Modify: `src/features/comments/components/CommentItem.tsx:129-171`

将纯文本 `<p>{comment.content}</p>` 替换为 `<MarkdownContent>`，编辑模式的 textarea 替换为 MarkdownEditor。

- [ ] **Step 1: 修改 CommentItem.tsx**

1. 添加 import：
```tsx
import { MarkdownEditor, MarkdownContent } from '../../../components/MarkdownEditor';
```

2. 替换编辑模式（第 131-158 行的 textarea）：
```tsx
// 原来:
<textarea
  className="comment-edit-textarea"
  value={editContent}
  onChange={e => setEditContent(e.target.value)}
  rows={3}
  disabled={isSubmitting}
/>

// 替换为:
<MarkdownEditor
  value={editContent}
  onChange={setEditContent}
  mode="compact"
  minRows={3}
  disabled={isSubmitting}
/>
```

3. 替换内容渲染（第 161-163 行）：
```tsx
// 原来:
<p className={comment.isDeleted ? 'comment-deleted' : ''}>
  {comment.content}
</p>

// 替换为:
{comment.isDeleted ? (
  <p className="comment-deleted">{comment.content}</p>
) : (
  <MarkdownContent content={comment.content} />
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/comments/components/CommentItem.tsx
git commit -m "feat(comments): render comment content as Markdown"
```

---

### Task 10: PostCommentItem 渲染升级

**Files:**
- Modify: `src/features/posts/components/PostCommentItem.tsx:109-113`

- [ ] **Step 1: 修改 PostCommentItem.tsx**

1. 添加 import：
```tsx
import { MarkdownContent } from '../../../components/MarkdownEditor';
```

2. 替换内容渲染（第 110-112 行）：
```tsx
// 原来:
<p className={comment.isDeleted ? 'post-comment-deleted' : ''}>
  {comment.content}
</p>

// 替换为:
{comment.isDeleted ? (
  <p className="post-comment-deleted">{comment.content}</p>
) : (
  <MarkdownContent content={comment.content} />
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/posts/components/PostCommentItem.tsx
git commit -m "feat(posts): render post comment content as Markdown"
```

---

## Chunk 5: 集成验证

### Task 11: 端到端验证

- [ ] **Step 1: 启动后端和前端**

```bash
# 终端 1
cd backend && npm start

# 终端 2
npm run dev
```

- [ ] **Step 2: 验证上传 API**

1. 登录获取 token
2. 用浏览器开发者工具或 curl 测试 `POST /api/uploads/image`
3. 确认图片保存到 `backend/uploads/images/`
4. 确认返回的 URL 可通过 `http://localhost:3001/uploads/images/xxx.jpg` 访问

- [ ] **Step 3: 验证帖子图片上传**

1. 进入创建帖子页面
2. 点击图片上传按钮，选择一张图片
3. 确认上传中显示 spinner
4. 确认上传完成后 `![image](url)` 插入编辑器
5. 确认预览区域正确显示图片
6. 发布帖子，确认帖子详情页图片正常显示

- [ ] **Step 4: 验证帖子评论图片上传**

1. 在帖子详情页发表评论
2. 使用 compact 编辑器的图片上传按钮
3. 确认评论发布后图片在评论列表中正确显示
4. 点击图片确认 lightbox 弹出

- [ ] **Step 5: 验证期刊评论图片上传**

1. 在期刊详情页发表评论
2. 确认 DimensionRatingInput 正常显示
3. 使用图片上传功能
4. 确认评论发布后图片正确渲染

- [ ] **Step 6: 验证文件限制**

1. 尝试上传超过 5MB 的文件，确认被拒绝
2. 尝试上传非图片文件（如 .txt），确认被拒绝
3. 未登录状态下确认无法上传

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(upload): complete image upload integration for posts and comments"
```
