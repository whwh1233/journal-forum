import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, Clock } from 'lucide-react';
import { TagInfo } from '../types/post';
import { tagService } from '../../../services/tagService';
import './TagInput.css';

interface TagInputProps {
  selectedTags: TagInfo[];
  onChange: (tags: TagInfo[], newTagNames: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onChange,
  maxTags = 10,
  disabled = false
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<TagInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [newTagNames, setNewTagNames] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isMaxReached = selectedTags.length + newTagNames.length >= maxTags;

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      setLoading(true);
      const { tags } = await tagService.suggestTags(query.trim());
      // Filter out already-selected tags
      const selectedIds = new Set(selectedTags.map(t => t.id));
      const selectedNames = new Set([
        ...selectedTags.map(t => t.name.toLowerCase()),
        ...newTagNames.map(n => n.toLowerCase())
      ]);
      const filtered = tags.filter(
        t => !selectedIds.has(t.id) && !selectedNames.has(t.name.toLowerCase())
      );

      // Sort: official first, then approved, then pending
      filtered.sort((a, b) => {
        if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
        if (a.status !== b.status) return a.status === 'approved' ? -1 : 1;
        return 0;
      });

      setSuggestions(filtered);
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, newTagNames]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Enforce max 10 chars
    if (value.length > 10) return;
    setInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Select an existing tag from suggestions
  const selectTag = (tag: TagInfo) => {
    const updatedTags = [...selectedTags, tag];
    onChange(updatedTags, newTagNames);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Create a new tag name
  const createNewTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updatedNewNames = [...newTagNames, trimmed];
    setNewTagNames(updatedNewNames);
    onChange(selectedTags, updatedNewNames);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Remove a selected tag
  const removeTag = (index: number) => {
    const updatedTags = selectedTags.filter((_, i) => i !== index);
    onChange(updatedTags, newTagNames);
  };

  // Remove a new tag name
  const removeNewTag = (index: number) => {
    const updatedNewNames = newTagNames.filter((_, i) => i !== index);
    setNewTagNames(updatedNewNames);
    onChange(selectedTags, updatedNewNames);
  };

  // Check if current input has an exact match in suggestions
  const hasExactMatch = suggestions.some(
    s => s.name.toLowerCase() === input.trim().toLowerCase()
  );
  const alreadySelected =
    selectedTags.some(t => t.name.toLowerCase() === input.trim().toLowerCase()) ||
    newTagNames.some(n => n.toLowerCase() === input.trim().toLowerCase());

  const showCreateOption = input.trim().length > 0 && !hasExactMatch && !alreadySelected;

  // Total options count for keyboard navigation
  const totalOptions = suggestions.length + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        selectTag(suggestions[highlightedIndex]);
      } else if (highlightedIndex === suggestions.length && showCreateOption) {
        createNewTag(input);
      } else if (showCreateOption && !showDropdown) {
        // If dropdown not shown but input has text, create new tag
        createNewTag(input);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="tag-input">
      {/* Selected chips */}
      {(selectedTags.length > 0 || newTagNames.length > 0) && (
        <div className="tag-input-chips">
          {selectedTags.map((tag, index) => (
            <span
              key={`tag-${tag.id}`}
              className={`tag-input-chip ${tag.status === 'pending' ? 'tag-input-chip--pending' : ''}`}
              title={tag.status === 'pending' ? '审核中' : undefined}
            >
              {tag.isOfficial && (
                <span className="tag-input-chip-icon">
                  <Star size={12} />
                </span>
              )}
              {tag.status === 'pending' && (
                <span className="tag-input-chip-icon">
                  <Clock size={12} />
                </span>
              )}
              {tag.name}
              <button
                type="button"
                className="tag-input-chip-remove"
                onClick={() => removeTag(index)}
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {newTagNames.map((name, index) => (
            <span
              key={`new-${index}`}
              className="tag-input-chip tag-input-chip--pending"
              title="审核中"
            >
              <span className="tag-input-chip-icon">
                <Clock size={12} />
              </span>
              {name}
              <button
                type="button"
                className="tag-input-chip-remove"
                onClick={() => removeNewTag(index)}
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="tag-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="tag-input-field"
          placeholder={isMaxReached ? `已达上限 (${maxTags})` : '输入标签名搜索或创建...'}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (input.trim()) fetchSuggestions(input); }}
          disabled={disabled || isMaxReached}
          maxLength={10}
        />

        {/* Dropdown */}
        {showDropdown && (suggestions.length > 0 || showCreateOption || loading) && (
          <div className="tag-input-dropdown" ref={dropdownRef}>
            {loading && (
              <div className="tag-input-loading">搜索中...</div>
            )}
            {!loading && suggestions.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                className={`tag-input-option ${highlightedIndex === index ? 'tag-input-option--highlighted' : ''}`}
                onClick={() => selectTag(tag)}
              >
                <span className="tag-input-option-left">
                  {tag.isOfficial && (
                    <span className="tag-input-option-icon">
                      <Star size={14} />
                    </span>
                  )}
                  <span className="tag-input-option-name">{tag.name}</span>
                </span>
                {tag.postCount !== undefined && (
                  <span className="tag-input-option-count">{tag.postCount} 篇</span>
                )}
              </button>
            ))}
            {!loading && showCreateOption && (
              <button
                type="button"
                className={`tag-input-option tag-input-option--create ${highlightedIndex === suggestions.length ? 'tag-input-option--highlighted' : ''}`}
                onClick={() => createNewTag(input)}
              >
                <span className="tag-input-option-left">
                  <span className="tag-input-option-icon">+</span>
                  <span className="tag-input-option-name">
                    创建「{input.trim()}」（审核后全局可见）
                  </span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="tag-input-hint">最多 10 字符，建议 4-5 字</div>
    </div>
  );
};

export default TagInput;
