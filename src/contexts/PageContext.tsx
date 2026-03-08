import React, { createContext, useContext, useState, useCallback } from 'react';

interface PageContextType {
  title: string;
  setTitle: (title: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState('');

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
  }, []);

  return (
    <PageContext.Provider value={{ title, setTitle }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
}

export function usePageTitle(title: string) {
  const { setTitle } = usePageContext();

  React.useEffect(() => {
    setTitle(title);
    return () => setTitle('');
  }, [title, setTitle]);
}
