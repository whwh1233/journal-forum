import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'default' | 'warm-nature' | 'sunset-glow';
export type ThemeMode = 'light' | 'dark';

interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    preview1: string;
    preview2: string;
    preview3: string;
  };
}

const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: '默认蓝',
    description: '经典学术蓝',
    colors: {
      preview1: '#2563eb',
      preview2: '#1e293b',
      preview3: '#f8fafc',
    },
  },
  {
    id: 'warm-nature',
    name: '温暖自然',
    description: '柔和米黄色系',
    colors: {
      preview1: '#d4a373',
      preview2: '#ccd5ae',
      preview3: '#fefae0',
    },
  },
  {
    id: 'sunset-glow',
    name: '日落辉光',
    description: '橙黄渐变色系',
    colors: {
      preview1: '#ffa200',
      preview2: '#ff7b00',
      preview3: '#ffdd00',
    },
  },
];

interface ThemeContextValue {
  currentTheme: ThemeId;
  currentMode: ThemeMode;
  themes: ThemeConfig[];
  setTheme: (themeId: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('app-theme') as ThemeId) || 'default';
  });

  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('app-theme-mode') as ThemeMode) || 'light';
  });

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement;

    // 移除所有主题
    root.removeAttribute('data-theme');

    // 应用新主题（默认主题不需要设置 data-theme）
    if (currentTheme !== 'default') {
      root.setAttribute('data-theme', currentTheme);
    } else if (currentMode === 'dark') {
      // 默认主题的深色模式
      root.setAttribute('data-theme', 'dark');
    }

    // 持久化
    localStorage.setItem('app-theme', currentTheme);
    localStorage.setItem('app-theme-mode', currentMode);
  }, [currentTheme, currentMode]);

  const setTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
  };

  const setMode = (mode: ThemeMode) => {
    setCurrentMode(mode);
  };

  const toggleMode = () => {
    setCurrentMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        currentMode,
        themes: THEMES,
        setTheme,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
