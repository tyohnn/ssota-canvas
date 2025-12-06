/**
 * Authentication & Authorization Error Messages
 *
 * Server Actions에서 사용하는 공통 에러 메시지 정의
 */

export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_ORG_MEMBER'
  | 'NOT_WORKSPACE_MEMBER';

export type BlockOwnershipErrorCode = 'BLOCK_NOT_FOUND' | 'WORKSPACE_MISMATCH';

/**
 * 인증/권한 에러 메시지 매핑
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  UNAUTHORIZED: 'User not authenticated',
  NOT_ORG_MEMBER: 'You are not a member of this organization',
  NOT_WORKSPACE_MEMBER: 'You do not have access to this workspace',
} as const;

/**
 * 블록 소유권 에러 메시지 매핑
 */
export const BLOCK_OWNERSHIP_ERROR_MESSAGES: Record<
  BlockOwnershipErrorCode,
  string
> = {
  BLOCK_NOT_FOUND: 'Block not found',
  WORKSPACE_MISMATCH: 'Block does not belong to this workspace',
} as const;

/**
 * 에러 코드에 해당하는 메시지 가져오기
 *
 * @param errorCode - 에러 코드
 * @param defaultMessage - 기본 메시지 (에러 코드가 없을 때)
 * @returns 에러 메시지
 */
export function getAuthErrorMessage(
  errorCode: AuthErrorCode | undefined,
  defaultMessage: string = 'Access denied'
): string {
  if (!errorCode) {
    return defaultMessage;
  }
  return AUTH_ERROR_MESSAGES[errorCode] || defaultMessage;
}

/**
 * 블록 소유권 에러 메시지 가져오기
 *
 * @param errorCode - 에러 코드
 * @param defaultMessage - 기본 메시지
 * @returns 에러 메시지
 */
export function getBlockOwnershipErrorMessage(
  errorCode: BlockOwnershipErrorCode | undefined,
  defaultMessage: string = 'Access denied'
): string {
  if (!errorCode) {
    return defaultMessage;
  }
  return BLOCK_OWNERSHIP_ERROR_MESSAGES[errorCode] || defaultMessage;
}

/**
 * 인증 관련 에러인지 확인
 *
 * getAuthenticatedUser()에서 throw하는 에러를 확인합니다.
 *
 * @param error - 확인할 에러 객체
 * @returns 인증 에러인지 여부
 */
export function isAuthenticationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;
  return (
    message.includes('UNAUTHORIZED') ||
    message.includes('BETA_ACCESS_REQUIRED') ||
    message.includes('USER_PROFILE_NOT_FOUND')
  );
}
