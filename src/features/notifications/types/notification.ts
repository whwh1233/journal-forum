export type NotificationType =
  | 'comment_reply'
  | 'post_comment'
  | 'post_comment_reply'
  | 'like'
  | 'new_follower'
  | 'follow_new_content'
  | 'journal_new_comment'
  | 'badge_earned'
  | 'comment_deleted'
  | 'submission_status'
  | 'system';

export type EntityType = 'journal' | 'comment' | 'post' | 'post_comment' | 'badge' | 'submission';

export interface NotificationContent {
  title: string;
  body: string;
  commentContent?: string;
  journalTitle?: string;
  postTitle?: string;
  contentTitle?: string;
  contentType?: string;
  badgeName?: string;
  badgeDescription?: string;
  reason?: string;
  status?: string;
  submissionTitle?: string;
}

export interface NotificationSender {
  id: string;
  name: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string | null;
  sender: NotificationSender | null;
  type: NotificationType;
  entityType: EntityType | null;
  entityId: string | null;
  content: NotificationContent;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}
