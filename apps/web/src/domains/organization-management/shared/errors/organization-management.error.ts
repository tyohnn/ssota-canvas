// apps/web/src/domains/organization-management/shared/errors/organization-management.error.ts

export class OrganizationManagementError extends Error {
  constructor(
    public readonly code: OrganizationManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'OrganizationManagementError';
  }
}

export type OrganizationManagementErrorCode =
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_NAME_DUPLICATE'
  | 'INVALID_ORGANIZATION_ID'
  | 'INVALID_ORGANIZATION_TYPE'
  | 'INVALID_INVITATION_ID'
  | 'INVALID_NOTIFICATION_ID'
  | 'INVALID_MEMBER_ROLE'
  | 'INVITATION_NOT_FOUND'
  | 'INVITATION_ALREADY_EXISTS'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_ALREADY_RESPONDED'
  | 'NOTIFICATION_NOT_FOUND'
  | 'MEMBER_ALREADY_EXISTS'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'CANNOT_CHANGE_OWNER_ROLE'
  | 'CANNOT_CHANGE_OWN_ROLE'
  | 'ROLE_ALREADY_ASSIGNED'
  | 'ADMIN_CANNOT_DEMOTE_ADMIN'
  | 'INVALID_ROLE_CHANGE'
  | 'ORGANIZATION_CREATION_FAILED'
  | 'ORGANIZATION_RETRIEVAL_FAILED'
  | 'INVITATION_CREATION_FAILED'
  | 'NOTIFICATION_CREATION_FAILED'
  | 'MEMBER_MANAGEMENT_FAILED'
  | 'OWNERSHIP_TRANSFER_FAILED'
  | 'ORGANIZATION_DELETION_FAILED';

// 사용자 메시지 매핑
export const ORGANIZATION_MANAGEMENT_ERROR_MESSAGES: Record<
  OrganizationManagementErrorCode,
  string
> = {
  ORGANIZATION_NOT_FOUND: '조직을 찾을 수 없습니다.',
  ORGANIZATION_NAME_DUPLICATE: '조직명이 이미 존재합니다.',
  INVALID_ORGANIZATION_ID: '올바르지 않은 조직 ID입니다.',
  INVALID_ORGANIZATION_TYPE: '올바르지 않은 조직 타입입니다.',
  INVALID_INVITATION_ID: '올바르지 않은 초대 ID입니다.',
  INVALID_NOTIFICATION_ID: '올바르지 않은 알림 ID입니다.',
  INVALID_MEMBER_ROLE: '올바르지 않은 멤버 역할입니다.',
  INVITATION_NOT_FOUND: '초대를 찾을 수 없습니다.',
  INVITATION_ALREADY_EXISTS: '이미 존재하는 초대입니다.',
  INVITATION_EXPIRED: '만료된 초대입니다.',
  INVITATION_ALREADY_RESPONDED: '이미 응답한 초대입니다.',
  NOTIFICATION_NOT_FOUND: '알림을 찾을 수 없습니다.',
  MEMBER_ALREADY_EXISTS: '이미 조직 멤버입니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  CANNOT_CHANGE_OWNER_ROLE:
    '소유자 역할은 소유권 이전을 통해서만 변경할 수 있습니다.',
  CANNOT_CHANGE_OWN_ROLE: '자신의 역할은 변경할 수 없습니다.',
  ROLE_ALREADY_ASSIGNED: '이미 해당 역할입니다.',
  ADMIN_CANNOT_DEMOTE_ADMIN: '관리자는 다른 관리자를 강등할 수 없습니다.',
  INVALID_ROLE_CHANGE: '올바르지 않은 역할 변경입니다.',
  ORGANIZATION_CREATION_FAILED: '조직 생성에 실패했습니다.',
  ORGANIZATION_RETRIEVAL_FAILED: '조직 조회에 실패했습니다.',
  INVITATION_CREATION_FAILED: '초대 생성에 실패했습니다.',
  NOTIFICATION_CREATION_FAILED: '알림 생성에 실패했습니다.',
  MEMBER_MANAGEMENT_FAILED: '멤버 관리에 실패했습니다.',
  OWNERSHIP_TRANSFER_FAILED: '소유권 이전에 실패했습니다.',
  ORGANIZATION_DELETION_FAILED: '조직 삭제에 실패했습니다.',
};
