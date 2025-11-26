// apps/web/src/domains/user-management/errors/user-management.error.ts

export class UserManagementError extends Error {
  constructor(
    public readonly code: UserManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export type UserManagementErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_NAME_DUPLICATE'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_USER_ID'
  | 'INVALID_ORGANIZATION_ID'
  | 'INVALID_ORGANIZATION_TYPE'
  | 'SUPABASE_AUTH_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'ORGANIZATION_CREATION_FAILED'
  | 'ORGANIZATION_RETRIEVAL_FAILED'
  | 'DEFAULT_ORGANIZATION_NOT_FOUND'
  | 'SETUP_STATUS_CHECK_FAILED';

// 사용자 메시지 매핑
export const USER_MANAGEMENT_ERROR_MESSAGES: Record<
  UserManagementErrorCode,
  string
> = {
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  ORGANIZATION_NOT_FOUND: '조직을 찾을 수 없습니다.',
  ORGANIZATION_NAME_DUPLICATE: '조직명이 이미 존재합니다.',
  INVALID_EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  INVALID_USER_ID: '올바르지 않은 사용자 ID입니다.',
  INVALID_ORGANIZATION_ID: '올바르지 않은 조직 ID입니다.',
  INVALID_ORGANIZATION_TYPE: '올바르지 않은 조직 타입입니다.',
  SUPABASE_AUTH_FAILED: '인증에 실패했습니다.',
  PROFILE_CREATION_FAILED: '프로필 생성에 실패했습니다.',
  ORGANIZATION_CREATION_FAILED: '조직 생성에 실패했습니다.',
  ORGANIZATION_RETRIEVAL_FAILED: '조직 조회에 실패했습니다.',
  DEFAULT_ORGANIZATION_NOT_FOUND: '기본 조직을 찾을 수 없습니다.',
  SETUP_STATUS_CHECK_FAILED: '설정 상태 확인에 실패했습니다.',
};
