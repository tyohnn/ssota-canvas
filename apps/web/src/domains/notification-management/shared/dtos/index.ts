// apps/web/src/domains/notification-management/shared/dtos/index.ts

import { NotificationType } from '../types';

export interface NotificationSummary {
  id: string; // Serialized from NotificationId
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string; // ISO 8601 string
  readAt: string | null; // ISO 8601 string
}

export interface UserNotificationView {
  userId: string;
  notifications: NotificationSummary[];
  unreadCount: number;
}

export interface CreateInvitationNotificationRequest {
  userId: string;
  invitationId: string;
  organizationName: string;
  inviterName: string;
  role: string;
}
