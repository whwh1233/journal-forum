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
  const valueRef = useRef(value);
  valueRef.current = value;
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>(
    mode === 'full' ? 'split' : 'edit'
  );

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

  const handleImageUpload = useCallback(async (file: File) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;

    const placeholderText = '![上传中...]()';
    const currentVal = valueRef.current;
    const newText = currentVal.substring(0, start) + placeholderText + currentVal.substring(start);
    onChange(newText);

    setIsUploading(true);

    try {
      const result = await uploadImage(file);
      const latestValue = valueRef.current;
      const finalText = latestValue.replace(placeholderText, `![image](${result.url})`);
      onChange(finalText);
    } catch (error: any) {
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
    e.target.value = '';
  }, [handleImageUpload]);

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
