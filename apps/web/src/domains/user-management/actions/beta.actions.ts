/**
 * Beta Access Management Actions
 *
 * 클로즈드 베타 신청 및 상태 관리를 위한 Server Actions
 *
 * ⚠️ Architecture: DDD Pattern
 * - Server Action: Trust Boundary (unknown + Zod validation)
 * - Internal Function: Validated data processing
 * - Service Layer: Business logic
 * - Repository Layer: Data persistence
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { DrizzleBetaRepository } from '../backend/repositories/implementations/drizzle-beta.repository';
import { BetaService } from '../backend/services/beta.service';
import { UserId } from '../shared/value-objects/ids.vo';
import { BetaApplicationSchema } from '../shared/schemas/beta.schemas';
import type { BetaStatusResponse } from '../shared/types/beta.types';

// ============================================
// Server Actions (Trust Boundary)
// ============================================

/**
 * Submit Beta Application Server Action
 *
 * ⚠️ Security: 이 함수는 HTTP를 통해 공개되므로 모든 입력을 검증합니다
 *
 * Defense in Depth:
 * 1. 사용자 인증 확인 (Supabase Auth)
 * 2. Request 스키마 검증 (Zod)
 * 3. Service Layer에서 비즈니스 로직 실행
 *
 * @param formData - 신청서 폼 데이터 (런타임 검증 필요)
 * @returns 성공 여부 및 에러 메시지
 */
export async function submitBetaApplicationAction(
  formData: unknown // 명시적으로 "신뢰하지 않음"
): Promise<{ success: boolean; error?: string }> {
  // 1. Runtime Validation (필수)
  const parseResult = BetaApplicationSchema.safeParse(formData);

  if (!parseResult.success) {
    console.warn('[Security] Invalid request to submitBetaApplicationAction', {
      errors: parseResult.error.issues,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'Invalid form data',
    };
  }

  // 2. 검증된 데이터는 타입 안전
  const validatedData = parseResult.data;

  // 3. 인증 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[Security] Unauthenticated beta application attempt', {
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: 'Authentication required' };
    }

    // 4. 내부 로직 호출 (검증 완료)
    return await submitBetaApplicationInternal(user.id, validatedData);
  } catch (error) {
    console.error('[submitBetaApplicationAction] Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Get Current User Beta Status Server Action
 *
 * 현재 로그인한 사용자의 베타 상태 조회
 *
 * @returns Beta status information 또는 null
 */
export async function getBetaStatusAction(): Promise<BetaStatusResponse | null> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // 2. 내부 로직 호출
    return await getBetaStatusInternal(user.id);
  } catch (error) {
    console.error('[getBetaStatusAction] Error:', error);
    return null;
  }
}

/**
 * Check Beta Redirect Server Action
 *
 * 사용자가 베타 신청 페이지로 리다이렉트되어야 하는지 확인
 *
 * @returns 리다이렉트 경로 또는 null
 */
export async function checkBetaRedirectAction(): Promise<string | null> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // 2. 내부 로직 호출
    return await checkBetaRedirectInternal(user.id);
  } catch (error) {
    console.error('[checkBetaRedirectAction] Error:', error);
    return null;
  }
}

/**
 * Check Beta Approval Status
 *
 * 현재 로그인한 사용자의 베타 승인 여부 확인
 * UI 렌더링에 사용 (MainHeader, Landing 등)
 *
 * @returns true if approved, false otherwise
 */
export async function checkBetaApprovalAction(): Promise<boolean> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    // 2. 베타 승인 여부 확인 (Internal 호출)
    return await checkBetaApprovalInternal(user.id);
  } catch (error) {
    console.error('[checkBetaApprovalAction] Error:', error);
    return false;
  }
}

// ============================================
// Internal Functions (Validated Data)
// ============================================

/**
 * Submit Beta Application Internal
 *
 * ⚠️ 이 함수는 이미 검증된 데이터만 받습니다
 *
 * @param userId - 인증된 사용자 ID
 * @param applicationData - 검증된 신청서 데이터
 * @returns 성공 여부 및 에러 메시지
 */
async function submitBetaApplicationInternal(
  userId: string,
  applicationData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 의존성 주입 (Repository 패턴)
    const betaRepository = new DrizzleBetaRepository();
    const betaService = new BetaService(betaRepository);

    // 2. Command 생성
    const command = {
      userId,
      applicationData,
    };

    // 3. Service Layer 호출
    const result = await betaService.submitApplication(command);

    if (result.isError()) {
      console.error(
        '[submitBetaApplicationInternal] Service error:',
        result.error
      );

      return {
        success: false,
        error: result.error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[submitBetaApplicationInternal] Internal error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get Beta Status Internal
 *
 * ⚠️ 이 함수는 이미 인증된 사용자만 받습니다
 *
 * @param userId - 인증된 사용자 ID
 * @returns Beta status information 또는 null
 */
async function getBetaStatusInternal(
  userId: string
): Promise<BetaStatusResponse | null> {
  try {
    // 1. 의존성 주입 (Repository 패턴)
    const betaRepository = new DrizzleBetaRepository();
    const betaService = new BetaService(betaRepository);

    // 2. Value Object 생성
    const userIdVO = new UserId(userId);

    // 3. Service Layer 호출
    const result = await betaService.getBetaStatus(userIdVO);

    if (result.isError()) {
      console.error('[getBetaStatusInternal] Service error:', result.error);
      return null;
    }

    return result.value;
  } catch (error) {
    console.error('[getBetaStatusInternal] Internal error:', error);
    return null;
  }
}

/**
 * Check Beta Redirect Internal
 *
 * ⚠️ 이 함수는 이미 인증된 사용자만 받습니다
 *
 * @param userId - 인증된 사용자 ID
 * @returns 리다이렉트 경로 또는 null
 */
async function checkBetaRedirectInternal(
  userId: string
): Promise<string | null> {
  try {
    // 1. 의존성 주입 (Repository 패턴)
    const betaRepository = new DrizzleBetaRepository();
    const betaService = new BetaService(betaRepository);

    // 2. Value Object 생성
    const userIdVO = new UserId(userId);

    // 3. Service Layer 호출
    const result = await betaService.checkBetaRedirect(userIdVO);

    if (result.isError()) {
      console.error('[checkBetaRedirectInternal] Service error:', result.error);
      return null;
    }

    return result.value;
  } catch (error) {
    console.error('[checkBetaRedirectInternal] Internal error:', error);
    return null;
  }
}

/**
 * Check Beta Approval Internal
 *
 * ⚠️ 이 함수는 이미 인증된 사용자만 받습니다
 *
 * @param userId - 인증된 사용자 ID
 * @returns 베타 승인 여부
 */
async function checkBetaApprovalInternal(userId: string): Promise<boolean> {
  try {
    // 1. 의존성 주입 (Repository 패턴)
    const betaRepository = new DrizzleBetaRepository();
    const userIdVO = new UserId(userId);

    // 2. Repository 호출
    return await betaRepository.isApproved(userIdVO);
  } catch (error) {
    console.error('[checkBetaApprovalInternal] Error:', error);
    return false;
  }
}
