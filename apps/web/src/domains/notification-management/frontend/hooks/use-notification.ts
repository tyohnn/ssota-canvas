'use client';

import { useMemo } from 'react';
import { useNotificationContext } from '../contexts/notification-context';
import { NotificationSummary } from '../../shared/dtos';

/**
 * Exposes notification state, actions, and utility helpers from the notification context.
 *
 * @returns An object containing:
 *  - notifications: the current list of notifications
 *  - unreadCount: the number of unread notifications
 *  - isLoading: whether notifications are currently loading
 *  - error: any error from the notification context
 *  - refreshNotifications: function to refresh the notification list
 *  - markAsRead: function to mark a notification as read
 *  - getInvitationNotifications: memoized list of notifications with type `'invitation'`
 *  - getUnreadNotifications: memoized list of notifications where `isRead` is `false`
 *  - hasUnreadNotifications: memoized boolean that is `true` when `unreadCount` > 0
 *  - getNotificationById: function that returns a `NotificationSummary` for a given id or `undefined` if not found
 */
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
