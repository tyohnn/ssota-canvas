// apps/web/src/domains/organization-management/backend/services/interfaces/organization-member.service.interface.ts

import type { Result } from '@/utils/result';
import type { OrganizationManagementError } from '../../../shared/errors/organization-management.error';
import type { ChangeMemberRoleCommand } from '../../../shared/commands';

/**
 * Organization Member Service Interface
 *
 * 조직 멤버 관리를 담당 (역할 변경, 제거, 소유권 이전)
 */
export interface OrganizationMemberService {
  /**
   * 멤버 역할 변경
   * - Owner 또는 Admin만 가능
   * - Owner 역할은 변경 불가 (소유권 이전 사용)
   * - Admin은 다른 Admin을 강등할 수 없음
   */
  changeMemberRole(
    command: ChangeMemberRoleCommand
  ): Promise<
    Result<
      { type: 'MemberPromotedToAdmin' | 'AdminDemotedToMember' },
      OrganizationManagementError
    >
  >;

  // 향후 추가 예정:
  // removeMember(command: RemoveMemberCommand): Promise<Result<void, OrganizationManagementError>>;
  // transferOwnership(command: TransferOwnershipCommand): Promise<Result<void, OrganizationManagementError>>;
}
