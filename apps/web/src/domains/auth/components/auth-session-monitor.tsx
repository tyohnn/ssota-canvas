'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/browser';

/**
 * Auth Session Monitor (Simplified)
 *
 * 필수 세션 이벤트만 처리하는 간소화된 컴포넌트
 *
 * 기능:
 * 1. 로그아웃 시 보호된 경로에서 자동 리다이렉트
 * 2. 토큰 갱신 시 서버 컴포넌트 데이터 갱신
 *
 * 참고:
 * - 세션 만료 없음 (timebox=0, inactivity_timeout=0)
 * - 멀티 디바이스 로그인 허용 (각 브라우저 독립적인 토큰)
 * - 주기적 세션 체크 불필요 (세션이 만료되지 않음)
 *
 * 사용 위치: app/layout.tsx (전역)
 */
export function AuthSessionMonitor({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isHandlingAuthChange = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // 세션 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // 동시 이벤트 처리 방지
        if (isHandlingAuthChange.current) return;

        try {
          isHandlingAuthChange.current = true;

          // 로그아웃 이벤트 처리
          if (event === 'SIGNED_OUT') {
            const currentPath = window.location.pathname;
            const protectedPaths = ['/r/', '/api/'];
            const isProtectedPath = protectedPaths.some(path =>
              currentPath.startsWith(path)
            );

            // 보호된 경로에서 로그인 페이지로 리다이렉트
            if (isProtectedPath) {
              const loginUrl = new URL('/login', window.location.origin);
              loginUrl.searchParams.set('message', 'You have been logged out.');
              loginUrl.searchParams.set('redirect', currentPath);
              window.location.href = loginUrl.toString();
            }
          }

          // 토큰 갱신 시 서버 컴포넌트 데이터 갱신
          if (event === 'TOKEN_REFRESHED' && session) {
            router.refresh();
          }
        } catch (error) {
          console.error('[AuthSessionMonitor] Error:', error);
        } finally {
          isHandlingAuthChange.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
