import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import TopBar from './TopBar';
import AnnouncementHandler from '@/features/announcements/components/AnnouncementHandler';
import PageTransition from '@/components/common/PageTransition';
import './AppLayout.css';

const STORAGE_KEY = 'sidenav-expanded';

const AppLayout: React.FC = () => {
  const [expanded, setExpanded] = useState(() => {
    // 默认展开；只有用户主动折叠后才为 false
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });

  const handleToggle = () => {
    setExpanded(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className={`app-layout${expanded ? ' nav-expanded' : ''}`}>
      {/* 侧边栏：position:fixed，不参与路由过渡 */}
      <SideNav expanded={expanded} onToggle={handleToggle} />

      {/* 内容区：路由过渡只作用于 Outlet，不触及 SideNav */}
      <main className="app-layout-main">
        <AnnouncementHandler />
        <TopBar />
        <PageTransition variant="subtle">
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};

export default AppLayout;
