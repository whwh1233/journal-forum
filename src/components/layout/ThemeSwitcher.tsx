import React, { useState, useEffect } from 'react';
import './ThemeSwitcher.css';

type ThemeId = 'light' | 'dark';
const STORAGE_KEY = 'app-theme';

const ThemeSwitcher: React.FC = () => {
  const [current, setCurrent] = useState<ThemeId>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'light';
  });

  useEffect(() => {
    applyTheme((localStorage.getItem(STORAGE_KEY) as ThemeId) || 'light');
  }, []);

  const applyTheme = (id: ThemeId) => {
    if (id === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', id);
    }
  };

  const handleToggle = () => {
    const next: ThemeId = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    setCurrent(next);
  };

  const isDark = current === 'dark';

  return (
    <button
      className={`theme-toggle${isDark ? ' dark' : ''}`}
      onClick={handleToggle}
      title={isDark ? '切换到浅色模式' : '切换到暗黑模式'}
      aria-label={isDark ? '切换到浅色模式' : '切换到暗黑模式'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
        <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true">☀</span>
        <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true">☾</span>
      </span>
    </button>
  );
};

export default ThemeSwitcher;
