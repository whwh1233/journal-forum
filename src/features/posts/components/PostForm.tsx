import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Heading,
  X,
  Eye,
  Edit3,
  Save,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Post, CreatePostData, PostCategory, CATEGORY_LABELS } from '../types/post';
import './PostForm.css';

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Post>;
  onSubmit: (data: CreatePostData) => void;
  onCancel: () => void;
}

const DRAFT_KEY = 'post_draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const PostForm: React.FC<PostFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState<PostCategory>(initialData?.category || 'other');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [journalId, setJournalId] = useState<number | undefined>(initialData?.journalId);
  const [journalTitle, setJournalTitle] = useState(initialData?.journalTitle || '');

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Check for draft on mount
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && !initialData) {
        try {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.title || parsedDraft.content) {
            setShowDraftRestore(true);
          }
        } catch (e) {
          // Invalid draft, ignore
        }
      }
    }
  }, [mode, initialData]);

  // Auto-save draft
  useEffect(() => {
    if (mode === 'create') {
      autoSaveTimerRef.current = setInterval(() => {
        saveDraft();
      }, AUTO_SAVE_INTERVAL);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [title, content, category, tags, journalId, mode]);

  const saveDraft = useCallback(() => {
    if (title || content) {
      const draft = {
        title,
        content,
        category,
        tags,
        journalId,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, [title, content, category, tags, journalId]);

  const restoreDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setTitle(parsedDraft.title || '');
        setContent(parsedDraft.content || '');
        setCategory(parsedDraft.category || 'other');
        setTags(parsedDraft.tags || []);
        setJournalId(parsedDraft.journalId);
      } catch (e) {
        // Invalid draft
      }
    }
    setShowDraftRestore(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftRestore(false);
  };

  // Markdown toolbar actions
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: <Bold size={18} />,
      label: '粗体',
      action: () => insertMarkdown('**', '**', '粗体文字')
    },
    {
      icon: <Italic size={18} />,
      label: '斜体',
      action: () => insertMarkdown('*', '*', '斜体文字')
    },
    {
      icon: <Heading size={18} />,
      label: '标题',
      action: () => insertMarkdown('## ', '', '标题')
    },
    {
      icon: <Code size={18} />,
      label: '代码',
      action: () => insertMarkdown('`', '`', '代码')
    },
    {
      icon: <Quote size={18} />,
      label: '引用',
      action: () => insertMarkdown('> ', '', '引用内容')
    },
    {
      icon: <List size={18} />,
      label: '无序列表',
      action: () => insertMarkdown('- ', '', '列表项')
    },
    {
      icon: <ListOrdered size={18} />,
      label: '有序列表',
      action: () => insertMarkdown('1. ', '', '列表项')
    },
    {
      icon: <LinkIcon size={18} />,
      label: '链接',
      action: () => insertMarkdown('[', '](url)', '链接文字')
    },
    {
      icon: <ImageIcon size={18} />,
      label: '图片',
      action: () => insertMarkdown('![', '](image-url)', '图片描述')
    }
  ];

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (title.length > 200) {
      newErrors.title = '标题不能超过200字符';
    }

    if (!content.trim()) {
      newErrors.content = '内容不能为空';
    }

    if (!category) {
      newErrors.category = '请选择分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (isDraft: boolean = false) => {
    if (!isDraft && !validate()) {
      return;
    }

    const data: CreatePostData = {
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      journalId
    };

    onSubmit(data);

    // Clear draft after successful submit
    if (mode === 'create') {
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  return (
    <div className="post-form">
      {/* Draft Restore Modal */}
      {showDraftRestore && (
        <div className="post-form-modal-overlay">
          <div className="post-form-modal">
            <div className="post-form-modal-icon">
              <AlertCircle size={48} />
            </div>
            <h3>检测到未保存的草稿</h3>
            <p>是否恢复之前的编辑内容？</p>
            <div className="post-form-modal-actions">
              <button onClick={restoreDraft} className="post-form-modal-button post-form-modal-button--primary">
                恢复草稿
              </button>
              <button onClick={discardDraft} className="post-form-modal-button">
                放弃
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="post-form-container">
        {/* Header */}
        <div className="post-form-header">
          <h2>{mode === 'create' ? '发布新帖' : '编辑帖子'}</h2>
          {lastSaved && (
            <div className="post-form-autosave">
              <CheckCircle size={14} />
              <span>已自动保存于 {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="post-form-field">
          <label htmlFor="title" className="post-form-label">
            标题 <span className="post-form-required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`post-form-input ${errors.title ? 'post-form-input--error' : ''}`}
            placeholder="输入帖子标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <div className="post-form-field-footer">
            {errors.title && <span className="post-form-error">{errors.title}</span>}
            <span className={`post-form-char-count ${title.length > 180 ? 'post-form-char-count--warning' : ''}`}>
              {title.length} / 200
            </span>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="post-form-row">
          <div className="post-form-field post-form-field--half">
            <label htmlFor="category" className="post-form-label">
              分类 <span className="post-form-required">*</span>
            </label>
            <select
              id="category"
              className={`post-form-select ${errors.category ? 'post-form-select--error' : ''}`}
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && <span className="post-form-error">{errors.category}</span>}
          </div>

          <div className="post-form-field post-form-field--half">
            <label htmlFor="tags" className="post-form-label">
              标签 <span className="post-form-optional">(可选)</span>
            </label>
            <input
              id="tags"
              type="text"
              className="post-form-input"
              placeholder="输入标签，按回车或逗号添加..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
            />
            {tags.length > 0 && (
              <div className="post-form-tags">
                {tags.map((tag, index) => (
                  <span key={index} className="post-form-tag">
                    {tag}
                    <button onClick={() => removeTag(index)} className="post-form-tag-remove">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="post-form-toolbar">
          <div className="post-form-toolbar-group">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                className="post-form-toolbar-button"
                title={button.label}
                onClick={button.action}
              >
                {button.icon}
              </button>
            ))}
          </div>

          <div className="post-form-view-toggle">
            <button
              className={`post-form-view-button ${viewMode === 'edit' ? 'post-form-view-button--active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              <Edit3 size={16} />
              <span>编辑</span>
            </button>
            <button
              className={`post-form-view-button ${viewMode === 'split' ? 'post-form-view-button--active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <span>分栏</span>
            </button>
            <button
              className={`post-form-view-button ${viewMode === 'preview' ? 'post-form-view-button--active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              <Eye size={16} />
              <span>预览</span>
            </button>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className={`post-form-editor-container post-form-editor-container--${viewMode}`}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="post-form-editor">
              <label className="post-form-label">
                内容 <span className="post-form-required">*</span>
              </label>
              <textarea
                ref={textareaRef}
                className={`post-form-textarea ${errors.content ? 'post-form-textarea--error' : ''}`}
                placeholder="在这里编写帖子内容，支持 Markdown 语法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {errors.content && <span className="post-form-error">{errors.content}</span>}
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="post-form-preview">
              <div className="post-form-label">预览</div>
              <div className="post-form-preview-content">
                {content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <div className="post-form-preview-empty">
                    暂无内容
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="post-form-actions">
          <button onClick={onCancel} className="post-form-button post-form-button--secondary">
            取消
          </button>
          <div className="post-form-actions-right">
            <button onClick={() => handleSubmit(true)} className="post-form-button post-form-button--outline">
              <Save size={18} />
              <span>保存草稿</span>
            </button>
            <button onClick={() => handleSubmit(false)} className="post-form-button post-form-button--primary">
              <Send size={18} />
              <span>{mode === 'create' ? '发布' : '更新'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
