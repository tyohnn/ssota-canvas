'use client';

import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/browser';

/**
 * Supabase Realtime 구독을 위한 옵션
 */
export interface UseSupabaseRealtimeOptions {
  /** 구독할 테이블 이름 */
  table: string;
  /** 감시할 이벤트 타입 */
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** 스키마 이름 (기본값: 'public') */
  schema?: string;
  /** 필터 조건 (예: 'user_id=eq.123') */
  filter?: string;
  /** 현재 사용자 ID로 자동 필터링 (user_id 컬럼 사용) */
  filterByCurrentUser?: boolean;
  /** 이벤트 발생 시 호출될 콜백 함수 */
  onEvent: (payload: any) => void;
  /** 구독 활성화 여부 (기본값: true) */
  enabled?: boolean;
  /** 채널 이름 (기본값: '{table}-changes') */
  channelName?: string;
}

/**
 * Supabase Realtime 구독을 관리하는 범용 훅
 * 
 * @example
 * ```tsx
 * // 알림 테이블 구독 (현재 사용자 전용)
 * useSupabaseRealtime({
 *   table: 'notifications',
 *   event: 'INSERT',
 *   filterByCurrentUser: true,  // user_id로 자동 필터링
 *   onEvent: (payload) => {
 *     console.log('New notification:', payload);
 *     refreshNotifications();
 *   }
 * });
 * 
 * // 페이지 테이블의 모든 변경사항 구독 (협업 에디터용)
 * useSupabaseRealtime({
 *   table: 'pages',
 *   event: '*',
 *   filter: `id=eq.${pageId}`,
 *   onEvent: (payload) => {
 *     handlePageUpdate(payload);
 *   }
 * });
 * ```
 */
export function useSupabaseRealtime({
  table,
  event,
  schema = 'public',
  filter,
  filterByCurrentUser = false,
  onEvent,
  enabled = true,
  channelName,
}: UseSupabaseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    // 비활성화된 경우 실행하지 않음
    if (!enabled) {
      return;
    }

    const supabase = supabaseRef.current;

    const setupRealtimeSubscription = async () => {
      // 인증된 사용자 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('[useSupabaseRealtime] User not authenticated, skipping subscription');
        return;
      }

      // 필터 생성: filterByCurrentUser가 true면 user_id 필터 추가
      let appliedFilter = filter;
      if (filterByCurrentUser) {
        appliedFilter = `user_id=eq.${user.id}`;
      }

      // 채널 이름 생성
      const channel = channelName || `${table}-changes`;

      // Realtime 채널 구독
      const realtimeChannel = supabase
        .channel(channel)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table,
            ...(appliedFilter && { filter: appliedFilter }),
          },
          (payload: any) => {
            console.log(`🔔 [${table}] Realtime event received:`, payload);
            onEvent(payload);
          }
        )
        .subscribe((status) => {
          console.log(`🔌 [${table}] Subscription status:`, status);
        });

      channelRef.current = realtimeChannel;
    };

    setupRealtimeSubscription();

    // 클린업: 컴포넌트 언마운트 시 또는 의존성 변경 시 구독 해제
    return () => {
      if (channelRef.current) {
        console.log(`🔌 [${table}] Unsubscribing from channel`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, schema, filter, filterByCurrentUser, enabled, channelName, onEvent]);
}
