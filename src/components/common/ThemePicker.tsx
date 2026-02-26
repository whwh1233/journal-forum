import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Palette, Sun, Moon } from 'lucide-react';
import './ThemePicker.css';

const ThemePicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentTheme, currentMode, themes, setTheme, toggleMode } = useTheme();

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="theme-picker" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        className="theme-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="切换主题"
        aria-label="切换主题"
      >
        <Palette size={20} />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="theme-picker-panel">
          <div className="theme-picker-header">
            <h3>选择主题</h3>

            {/* 深浅模式切换 */}
            <button
              className={`mode-toggle ${currentMode}`}
              onClick={toggleMode}
              title={currentMode === 'light' ? '切换到深色' : '切换到浅色'}
              aria-label={currentMode === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {currentMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {/* 主题列表 */}
          <div className="theme-list">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => {
                  setTheme(theme.id);
                  setIsOpen(false);
                }}
              >
                {/* 色块预览 */}
                <div className="theme-preview">
                  <span style={{ background: theme.colors.preview1 }} />
                  <span style={{ background: theme.colors.preview2 }} />
                  <span style={{ background: theme.colors.preview3 }} />
                </div>

                {/* 主题名称 */}
                <div className="theme-info">
                  <span className="theme-name">{theme.name}</span>
                  <span className="theme-desc">{theme.description}</span>
                </div>

                {/* 选中标记 */}
                {currentTheme === theme.id && (
                  <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
