import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Post, CreatePostData, PostCategoryInfo, TagInfo, CATEGORY_LABELS } from '../types/post';
import { postCategoryService } from '../../../services/postCategoryService';
import { MarkdownEditor } from '../../../components/MarkdownEditor';
import TagInput from './TagInput';
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
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialData?.categoryId || undefined
  );
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>(initialData?.tags_assoc || []);
  const [newTagNames, setNewTagNames] = useState<string[]>([]);
  const [journalId, setJournalId] = useState<number | undefined>(initialData?.journalId);
  const [journalTitle, setJournalTitle] = useState(initialData?.journalTitle || '');

  const [categories, setCategories] = useState<PostCategoryInfo[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const draftStateRef = useRef({ title, content, categoryId, selectedTags, newTagNames, journalId });

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { categories: cats } = await postCategoryService.getCategories();
        setCategories(cats);
        // If editing and we have a category slug but no categoryId, try to map it
        if (initialData?.category && !initialData?.categoryId && cats.length > 0) {
          const match = cats.find(c => c.slug === initialData.category);
          if (match) setCategoryId(match.id);
        }
        // Default to first category if none selected
        if (!categoryId && !initialData?.categoryId && cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch {
        // Fallback: categories will be empty, user sees empty select
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync with latest form state (no interval rebuilding)
  useEffect(() => {
    draftStateRef.current = { title, content, categoryId, selectedTags, newTagNames, journalId };
  }, [title, content, categoryId, selectedTags, newTagNames, journalId]);

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

  // Auto-save draft — interval created once on mount, reads latest state via ref
  useEffect(() => {
    if (mode !== 'create') return;
    autoSaveTimerRef.current = setInterval(() => {
      const { title: t, content: c, categoryId: cid, selectedTags: stags, newTagNames: ntags, journalId: jid } = draftStateRef.current;
      if (t || c) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title: t, content: c, categoryId: cid,
          selectedTags: stags, newTagNames: ntags, journalId: jid,
          savedAt: new Date().toISOString()
        }));
        setLastSaved(new Date());
      }
    }, AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [mode]); // depends only on mode — NOT on form state

  const restoreDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setTitle(parsedDraft.title || '');
        setContent(parsedDraft.content || '');
        // Support both old (category slug) and new (categoryId) draft format
        if (parsedDraft.categoryId) {
          setCategoryId(parsedDraft.categoryId);
        } else if (parsedDraft.category && categories.length > 0) {
          const match = categories.find(c => c.slug === parsedDraft.category);
          if (match) setCategoryId(match.id);
        }
        setSelectedTags(parsedDraft.selectedTags || []);
        setNewTagNames(parsedDraft.newTagNames || []);
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

  // Handle tag changes from TagInput
  const handleTagsChange = (tags: TagInfo[], newNames: string[]) => {
    setSelectedTags(tags);
    setNewTagNames(newNames);
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

    if (!categoryId) {
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
      categoryId: categoryId || 0,
      tagIds: selectedTags.filter(t => t.id).map(t => t.id),
      newTags: newTagNames.length > 0 ? newTagNames : undefined,
      journalId,
      status: isDraft ? 'draft' : 'published',
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
              value={categoryId || ''}
              onChange={(e) => setCategoryId(Number(e.target.value) || undefined)}
              disabled={categoriesLoading}
            >
              {categoriesLoading ? (
                <option value="">加载中...</option>
              ) : (
                <>
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.category && <span className="post-form-error">{errors.category}</span>}
          </div>

          <div className="post-form-field post-form-field--half">
            <label htmlFor="tags" className="post-form-label">
              标签 <span className="post-form-optional">(可选)</span>
            </label>
            <TagInput
              selectedTags={selectedTags}
              onChange={handleTagsChange}
              maxTags={10}
            />
          </div>
        </div>

        {/* Content Editor */}
        <div className="post-form-field">
          <label className="post-form-label">
            内容 <span className="post-form-required">*</span>
          </label>
          <MarkdownEditor
            mode="full"
            value={content}
            onChange={setContent}
            placeholder="写下你的想法..."
            minRows={12}
            disabled={false}
          />
          {errors.content && <span className="post-form-error">{errors.content}</span>}
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
