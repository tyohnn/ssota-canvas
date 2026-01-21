'use client';

import { useNotificationContext } from '../contexts/notification-context';

/**
 * 읽지 않은 알림 개수만 가져오는 경량 훅
 * 
 * InboxButton처럼 unreadCount만 필요한 컴포넌트에서 사용하면
 * 불필요한 notifications 배열 구독을 피할 수 있습니다.
 * 
 * @example
 * ```tsx
 * function InboxButton() {
 *   const unreadCount = useUnreadCount();
 *   return <Badge>{unreadCount}</Badge>;
 * }
 * ```
 */
export function useUnreadCount(): number {
  const { unreadCount } = useNotificationContext();
  return unreadCount;
}
