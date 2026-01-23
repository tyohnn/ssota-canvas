'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { UserNotificationView, NotificationSummary } from '../../shared/dtos';
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
} from '../../actions/notification.actions';
import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks';

interface NotificationContextType {
  notifications: NotificationSummary[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserNotificationsAction();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        // Optimistic update: 즉시 UI 업데이트
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // 서버에 읽음 처리 요청
        await markNotificationAsReadAction(notificationId);
      } catch (err) {
        // 실패 시 다시 조회하여 롤백
        setError(err instanceof Error ? err.message : 'Failed to mark as read');
        await refreshNotifications();
      }
    },
    [refreshNotifications]
  );

  useEffect(() => {
    // 초기 마운트 시에만 알림 조회 (에러 발생해도 괜찮음)
    refreshNotifications();
  }, [refreshNotifications]);


  // Supabase Realtime 구독: 새 알림이 추가되면 자동으로 갱신
  // useSupabaseRealtime 훅이 내부에서 사용자 인증 및 필터링을 처리합니다
  useSupabaseRealtime({
    table: 'notifications',
    event: 'INSERT',
    schema: 'public',
    filterByCurrentUser: true,  // 현재 사용자의 알림만 구독
    onEvent: () => {
      // 새 알림이 추가되면 목록 갱신
      refreshNotifications();
    },
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refreshNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    );
  }
  return context;
}
 