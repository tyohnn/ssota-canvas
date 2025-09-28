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
  | 'USER_DELETED'
  | 'USER_ALREADY_DELETED'
  | 'USER_NOT_DELETED'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_DELETED'
  | 'ORGANIZATION_ALREADY_DELETED'
  | 'ORGANIZATION_NOT_DELETED'
  | 'ORGANIZATION_PERMANENTLY_DELETED'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_SLUG_FORMAT'
  | 'INVALID_USER_ID'
  | 'INVALID_ORGANIZATION_ID'
  | 'INVALID_MEMBERSHIP_ID'
  | 'MEMBERSHIP_ALREADY_EXISTS'
  | 'MEMBERSHIP_NOT_ACTIVE'
  | 'MEMBERSHIP_ALREADY_DELETED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_NOT_PENDING'
  | 'CANNOT_TRANSFER_DEFAULT'
  | 'CANNOT_DELETE_DEFAULT'
  | 'CANNOT_CHANGE_OWN_ROLE'
  | 'CANNOT_REMOVE_SELF'
  | 'USER_NOT_MEMBER'
  | 'CLERK_SYNC_FAILED'
  | 'CLERK_ID_MISMATCH'
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'LOGIN_FAILED'
  | 'LOGOUT_FAILED'
  | 'USER_SYNC_FAILED';

// 사용자 메시지 매핑
export const USER_MANAGEMENT_ERROR_MESSAGES: Record<
  UserManagementErrorCode,
  string
> = {
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  USER_DELETED: '삭제된 사용자입니다.',
  USER_ALREADY_DELETED: '이미 삭제된 사용자입니다.',
  USER_NOT_DELETED: '삭제되지 않은 사용자입니다.',
  ORGANIZATION_NOT_FOUND: '조직을 찾을 수 없습니다.',
  ORGANIZATION_DELETED: '삭제된 조직입니다.',
  ORGANIZATION_ALREADY_DELETED: '이미 삭제된 조직입니다.',
  ORGANIZATION_NOT_DELETED: '삭제되지 않은 조직입니다.',
  ORGANIZATION_PERMANENTLY_DELETED: '영구 삭제된 조직은 복구할 수 없습니다.',
  INVALID_EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  INVALID_SLUG_FORMAT: '올바른 슬러그 형식이 아닙니다.',
  INVALID_USER_ID: '올바르지 않은 사용자 ID입니다.',
  INVALID_ORGANIZATION_ID: '올바르지 않은 조직 ID입니다.',
  INVALID_MEMBERSHIP_ID: '올바르지 않은 멤버십 ID입니다.',
  MEMBERSHIP_ALREADY_EXISTS: '이미 조직의 멤버입니다.',
  MEMBERSHIP_NOT_ACTIVE: '활성화되지 않은 멤버십입니다.',
  MEMBERSHIP_ALREADY_DELETED: '이미 삭제된 멤버십입니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  INVITATION_EXPIRED: '초대 링크가 만료되었습니다.',
  INVITATION_NOT_PENDING: '대기 중인 초대가 아닙니다.',
  CANNOT_TRANSFER_DEFAULT: '기본 조직의 소유권은 이전할 수 없습니다.',
  CANNOT_DELETE_DEFAULT: '기본 조직은 삭제할 수 없습니다.',
  CANNOT_CHANGE_OWN_ROLE: '자신의 역할은 변경할 수 없습니다.',
  CANNOT_REMOVE_SELF: '자신을 조직에서 제거할 수 없습니다.',
  USER_NOT_MEMBER: '조직의 멤버가 아닙니다.',
  CLERK_SYNC_FAILED: '외부 인증 시스템과 동기화에 실패했습니다.',
  CLERK_ID_MISMATCH: 'Clerk ID가 일치하지 않습니다.',
  AUTH_REQUIRED: '인증이 필요합니다.',
  AUTH_FAILED: '인증에 실패했습니다.',
  LOGIN_FAILED: '로그인에 실패했습니다.',
  LOGOUT_FAILED: '로그아웃에 실패했습니다.',
  USER_SYNC_FAILED: '사용자 동기화에 실패했습니다.',
};
