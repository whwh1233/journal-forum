export type AnnouncementType = 'normal' | 'urgent' | 'banner';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
export type TargetType = 'all' | 'role' | 'user';
export type ColorScheme = 'info' | 'success' | 'warning' | 'danger';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  priority: number;
  targetType: TargetType;
  targetRoles: string[] | null;
  targetUserIds: string[] | null;
  colorScheme: ColorScheme;
  customColor: string | null;
  isPinned: boolean;
  startTime: string | null;
  endTime: string | null;
  creatorId: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  readAt?: string | null;
  dismissed?: boolean;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AdminAnnouncementListResponse {
  announcements: (Announcement & { readCount: number; readPercentage: number })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: AnnouncementType;
  targetType: TargetType;
  targetRoles?: string[];
  targetUserIds?: string[];
  colorScheme?: ColorScheme;
  customColor?: string;
  isPinned?: boolean;
  priority?: number;
  startTime?: string;
  endTime?: string;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {}

export interface AdminAnnouncementFilters {
  status?: AnnouncementStatus;
  type?: AnnouncementType;
  sortBy?: 'createdAt' | 'startTime' | 'priority';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
