// apps/web/src/domains/organization-management/backend/services/organization-member.service.ts

import type { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import type { OrganizationMemberRepository } from '../repositories/interfaces/organization-member.repository.interface';
import { UserId, OrganizationId } from '../../shared/value-objects/ids.vo';
import { MemberRole } from '../../shared/value-objects/member-role.vo';
import { OrganizationManagementError } from '../../shared/errors/organization-management.error';
import { Result } from '@/utils/result';
import type { ChangeMemberRoleCommand } from '../../shared/commands';
import type { OrganizationMemberService } from './interfaces/organization-member.service.interface';
import { eventLog } from '@/utils/dev-logger';

/**
 * Organization Member Service Implementation
 *
 * 조직 멤버 관리를 담당 (역할 변경, 제거, 소유권 이전)
 */
export class DefaultOrganizationMemberService
  implements OrganizationMemberService
{
  constructor(
    private organizationRepository: OrganizationRepository,
    private organizationMemberRepository: OrganizationMemberRepository
  ) {}

  /**
   * 멤버 역할 변경
   * - Owner 또는 Admin만 가능
   * - Owner 역할은 변경 불가 (소유권 이전 사용)
   * - Admin은 다른 Admin을 강등할 수 없음
   */
  async changeMemberRole(
    command: ChangeMemberRoleCommand
  ): Promise<
    Result<
      { type: 'MemberPromotedToAdmin' | 'AdminDemotedToMember' },
      OrganizationManagementError
    >
  > {
    try {
      const organizationId = new OrganizationId(command.organizationId);
      const targetUserId = new UserId(command.userId);
      const currentUserId = new UserId(command.requesterId);
      const newRole = new MemberRole(command.newRole);

      // 1. 조직 조회 (Admin DB - Admin도 역할 변경 가능하므로)
      const organization =
        await this.organizationRepository.findByIdAsAdmin(organizationId);
      if (!organization) {
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NOT_FOUND',
            'Organization not found'
          )
        );
      }

      // 2. 현재 사용자 권한 확인 (organization_members에서 조회)
      const currentUserMemberRole =
        await this.organizationMemberRepository.findMemberRole(
          organizationId,
          currentUserId
        );

      if (!currentUserMemberRole) {
        return Result.error(
          new OrganizationManagementError(
            'INSUFFICIENT_PERMISSIONS',
            'User is not a member of this organization'
          )
        );
      }

      const currentUserRole = currentUserMemberRole.value as
        | 'owner'
        | 'admin'
        | 'member';

      if (currentUserRole === 'member') {
        return Result.error(
          new OrganizationManagementError(
            'INSUFFICIENT_PERMISSIONS',
            'Member does not have permission to change roles'
          )
        );
      }

      // 3. 대상 멤버 역할 조회 및 검증 (organization_members에서 조회)
      const targetMemberMemberRole =
        await this.organizationMemberRepository.findMemberRole(
          organizationId,
          targetUserId
        );

      if (!targetMemberMemberRole) {
        return Result.error(
          new OrganizationManagementError(
            'MEMBER_MANAGEMENT_FAILED',
            'Target user is not a member of this organization'
          )
        );
      }

      const targetMemberRole = targetMemberMemberRole.value as
        | 'owner'
        | 'admin'
        | 'member';

      // 4. 관리자가 관리자를 강등하려는 경우 명시적으로 체크 (Service Layer)
      if (
        currentUserRole === 'admin' &&
        targetMemberRole === 'admin' &&
        newRole.value === 'member'
      ) {
        return Result.error(
          new OrganizationManagementError(
            'ADMIN_CANNOT_DEMOTE_ADMIN',
            'Admin cannot demote another admin'
          )
        );
      }

      // 5. 계층적 권한 시스템 검증 (OrganizationAggregate로 위임)
      const event = organization.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole.value as 'admin' | 'member'
      );

      // 6. adminDb로 역할 업데이트 (organization_members 테이블)
      await this.organizationMemberRepository.updateMemberRole(
        organizationId,
        targetUserId,
        newRole
      );

      // 핵심 이벤트 로그
      eventLog('[changeMemberRole] Success', {
        organizationId: organizationId.value,
        targetUserId: targetUserId.value,
        currentUserId: currentUserId.value,
        oldRole: targetMemberRole,
        newRole: newRole.value,
        eventType: event.type,
      });

      return Result.success({ type: event.type });
    } catch (error) {
      // OrganizationAggregate에서 발생한 에러는 그대로 전파
      if (error instanceof OrganizationManagementError) {
        return Result.error(error);
      }

      console.error('[changeMemberRole] Unexpected error:', error);
      return Result.error(
        new OrganizationManagementError(
          'MEMBER_MANAGEMENT_FAILED',
          'Failed to change member role',
          { error }
        )
      );
    }
  }
}

