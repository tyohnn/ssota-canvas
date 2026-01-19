/**
 * Client-side Authentication Helpers
 *
 * Browser/Client Components에서 사용하는 인증 헬퍼 함수들
 */

import { createClient } from '@/utils/supabase/browser';
import type { User } from '@supabase/supabase-js';

/**
 * 현재 인증된 사용자 가져오기 (선택적)
 *
 * 클라이언트 컴포넌트에서 사용자 정보가 필요할 때 사용
 * 인증되지 않은 경우 null 반환 (에러 없음)
 *
 * @returns User | null
 *
 * @example
 * ```typescript
 * 'use client';
 *
 * export function MyComponent() {
 *   const handleAction = async () => {
 *     const user = await getUser();
 *     if (!user) {
 *       // 로그인 필요
 *       return;
 *     }
 *     // 사용자 정보 사용
 *   };
 * }
 * ```
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
