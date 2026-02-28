import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getMyBadges, markBadgesAsRead } from '../services/badgeService';
import { useAuth } from '../hooks/useAuth';
import type { Badge } from '../types';

interface BadgeContextType {
  hasNewBadges: boolean;
  newBadgesList: Badge[];
  setNewBadges: (badges: Badge[]) => void;
  clearNewBadges: () => Promise<void>;
  refreshBadges: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [hasNewBadges, setHasNewBadges] = useState(false);
  const [newBadgesList, setNewBadgesList] = useState<Badge[]>([]);

  const refreshBadges = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await getMyBadges();
      setHasNewBadges(data.hasNewBadges);
    } catch (error) {
      console.error('Failed to refresh badges:', error);
    }
  }, [isAuthenticated]);

  const setNewBadges = useCallback((badges: Badge[]) => {
    if (badges.length > 0) {
      setNewBadgesList(prev => [...prev, ...badges]);
      setHasNewBadges(true);
    }
  }, []);

  const clearNewBadges = useCallback(async () => {
    try {
      await markBadgesAsRead();
      setHasNewBadges(false);
      setNewBadgesList([]);
    } catch (error) {
      console.error('Failed to mark badges as read:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBadges();
    } else {
      setHasNewBadges(false);
      setNewBadgesList([]);
    }
  }, [isAuthenticated, refreshBadges]);

  return (
    <BadgeContext.Provider value={{
      hasNewBadges,
      newBadgesList,
      setNewBadges,
      clearNewBadges,
      refreshBadges
    }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadgeContext = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadgeContext must be used within a BadgeProvider');
  }
  return context;
};

export default BadgeContext;
