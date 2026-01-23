'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { createClient } from '@/utils/supabase/browser';
import { UserNotificationView, NotificationSummary } from '../../shared/dtos';
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
} from '../../actions/notification.actions';

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
  useEffect(() => {
    const supabase = createClient();

    // 현재 사용자 ID 가져오기
    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // notifications 테이블의 INSERT 이벤트 구독
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`, // 현재 사용자의 알림만
          },
          (payload) => {
            console.log('🔔 New notification received:', payload);
            // 새 알림이 추가되면 목록 갱신
            refreshNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [refreshNotifications]);

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
