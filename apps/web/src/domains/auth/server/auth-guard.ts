/**
 * Auth Guard - Server-side Authentication Helpers
 *
 * Server Actions에서 반복되는 인증 로직을 공통화
 *
 * 사용 예시:
 * ```typescript
 * export async function myAction() {
 *   // 간단한 인증 체크 (User 객체만 필요)
 *   const user = await requireAuth('myAction');
 *
 *   // 또는 에러 반환 방식
 *   const authResult = await checkAuth('myAction');
 *   if (!authResult.success) {
 *     return err(authResult.error, { code: 'UNAUTHORIZED' });
 *   }
 *   const user = authResult.user;
 * }
 * ```
 */

import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface AuthCheckResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: 'SESSION_EXPIRED' | 'AUTH_FAILED' | 'UNAUTHORIZED';
}

// ============================================
// 1. 간단한 인증 체크 (throw 방식)
// ============================================

/**
 * 인증된 사용자 확인 (throw 방식)
 *
 * 인증 실패 시 Error를 throw하므로 try-catch로 감싸서 사용
 *
 * @param actionName - 액션 이름 (로깅용)
 * @throws Error - 인증 실패 시
 * @returns Supabase User 객체
 *
 * @example
 * ```typescript
 * export async function myAction() {
 *   try {
 *     const user = await requireAuth('myAction');
 *     // 인증 성공, user 사용
 *   } catch (error) {
 *     return err(error.message, { code: 'UNAUTHORIZED' });
 *   }
 * }
 * ```
 */
export async function requireAuth(actionName?: string): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const logPrefix = actionName ? `[${actionName}]` : '[requireAuth]';
    console.error(`${logPrefix} Authentication failed:`, {
      error: authError?.message || 'No error message',
      hasUser: !!user,
      errorCode: authError?.status,
      timestamp: new Date().toISOString(),
    });

    // 세션 만료 에러 감지
    if (
      authError?.message?.includes('session') ||
      authError?.message?.includes('Auth')
    ) {
      throw new Error('SESSION_EXPIRED');
    }

    throw new Error('Authentication required');
  }

  return user;
}

// ============================================
// 2. 안전한 인증 체크 (Result 방식)
// ============================================

/**
 * 인증된 사용자 확인 (Result 방식)
 *
 * throw하지 않고 결과 객체를 반환하므로 더 안전
 *
 * @param actionName - 액션 이름 (로깅용)
 * @returns AuthCheckResult - 성공 여부와 User 객체
 *
 * @example
 * ```typescript
 * export async function myAction() {
 *   const authResult = await checkAuth('myAction');
 *   if (!authResult.success) {
 *     return err(authResult.error, { code: authResult.errorCode });
 *   }
 *   const user = authResult.user!;
 *   // 계속 진행
 * }
 * ```
 */
export async function checkAuth(actionName?: string): Promise<AuthCheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const logPrefix = actionName ? `[${actionName}]` : '[checkAuth]';
    console.error(`${logPrefix} Authentication failed:`, {
      error: authError?.message || 'No error message',
      hasUser: !!user,
      errorCode: authError?.status,
      timestamp: new Date().toISOString(),
    });

    // 세션 만료 에러 감지
    const isSessionExpired =
      authError?.message?.includes('session') ||
      authError?.message?.includes('Auth');

    return {
      success: false,
      error: isSessionExpired
        ? 'Session expired. Please log in again.'
        : 'User not authenticated',
      errorCode: isSessionExpired ? 'SESSION_EXPIRED' : 'AUTH_FAILED',
    };
  }

  return {
    success: true,
    user,
  };
}

// ============================================
// 3. 조건부 인증 체크
// ============================================

/**
 * 인증된 사용자 확인 (선택적)
 *
 * 인증되지 않은 경우 null 반환 (에러 없음)
 * 공개 API나 선택적 인증이 필요한 경우 사용
 *
 * @returns User | null
 *
 * @example
 * ```typescript
 * export async function publicAction() {
 *   const user = await getOptionalAuth();
 *   if (user) {
 *     // 인증된 사용자 로직
 *   } else {
 *     // 비인증 사용자 로직
 *   }
 * }
 * ```
 */
export async function getOptionalAuth(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ============================================
// 4. 사용자 ID만 필요한 경우
// ============================================

/**
 * 인증된 사용자 ID 가져오기
 *
 * User 객체 전체가 아닌 ID만 필요한 경우 사용
 *
 * @param actionName - 액션 이름 (로깅용)
 * @throws Error - 인증 실패 시
 * @returns 사용자 ID (string)
 *
 * @example
 * ```typescript
 * export async function myAction() {
 *   const userId = await requireUserId('myAction');
 *   // userId 사용
 * }
 * ```
 */
export async function requireUserId(actionName?: string): Promise<string> {
  const user = await requireAuth(actionName);
  return user.id;
}
