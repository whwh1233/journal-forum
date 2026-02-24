import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
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
              {currentMode === 'light' ? '🌙' : '☀️'}
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
