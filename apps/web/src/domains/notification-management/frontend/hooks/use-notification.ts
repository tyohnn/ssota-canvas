'use client';

import { useMemo } from 'react';
import { useNotificationContext } from '../contexts/notification-context';
import { NotificationSummary } from '../../shared/dtos';

export function useNotification() {
  const context = useNotificationContext();

  // 유틸리티 함수
  const getInvitationNotifications = useMemo(() => {
    return context.notifications.filter(n => n.type === 'invitation');
  }, [context.notifications]);

  const getUnreadNotifications = useMemo(() => {
    return context.notifications.filter(n => !n.isRead);
  }, [context.notifications]);

  const hasUnreadNotifications = useMemo(() => {
    return context.unreadCount > 0;
  }, [context.unreadCount]);

  const getNotificationById = (id: string): NotificationSummary | undefined => {
    return context.notifications.find(n => n.id === id);
  };

  return {
    // 상태
    notifications: context.notifications,
    unreadCount: context.unreadCount,
    isLoading: context.isLoading,
    error: context.error,

    // 액션
    refreshNotifications: context.refreshNotifications,
    markAsRead: context.markAsRead,

    // 유틸리티
    getInvitationNotifications,
    getUnreadNotifications,
    hasUnreadNotifications,
    getNotificationById,
  };
}

