// apps/web/src/domains/organization-management/backend/services/organization-invitation.service.ts

import type { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import type { OrganizationMemberRepository } from '../repositories/interfaces/organization-member.repository.interface';
import type { InvitationRepository } from '../repositories/interfaces/invitation.repository.interface';
import { InvitationAggregate } from '../../shared/aggregates/invitation.aggregate';
import {
  UserId,
  OrganizationId,
  InvitationId,
} from '../../shared/value-objects/ids.vo';
import { MemberRole } from '../../shared/value-objects/member-role.vo';
import { OrganizationManagementError } from '../../shared/errors/organization-management.error';
import { Result } from '@/utils/result';
import type {
  RequestMemberInvitationCommand,
  AcceptInvitationCommand,
  RejectInvitationCommand,
} from '../../shared/commands';
import type { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import type { WorkspaceCrudService } from '@/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface';
import type { OrganizationInvitationService } from './interfaces/organization-invitation.service.interface';
import { devLog, eventLog } from '@/utils/dev-logger';

/**
 * Organization Invitation Service Implementation
 *
 * 조직 멤버 초대, 수락, 거절을 담당
 */
export class DefaultOrganizationInvitationService
  implements OrganizationInvitationService
{
  constructor(
    private organizationRepository: OrganizationRepository,
    private invitationRepository: InvitationRepository,
    private organizationMemberRepository: OrganizationMemberRepository,
    private workspaceCrudService: WorkspaceCrudService, // v1.2
    private notificationService?: NotificationService
  ) {}

  /**
   * 조직에 멤버 초대
   */
  async inviteMember(
    command: RequestMemberInvitationCommand
  ): Promise<Result<InvitationAggregate, OrganizationManagementError>> {
    try {
      devLog('[inviteMember] Checking organization', {
        organizationId: command.organizationId,
      });

      // 1. 조직 확인 (Admin DB - Admin도 초대 가능하므로)
      const organization = await this.organizationRepository.findByIdAsAdmin(
        new OrganizationId(command.organizationId)
      );

      if (!organization) {
        console.error(
          '[inviteMember] Organization not found:',
          command.organizationId
        );
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NOT_FOUND',
            'Organization not found'
          )
        );
      }

      // 2. 초대자 권한 확인 (소유자 또는 관리자)
      const inviterUserId = new UserId(command.inviterUserId);
      const isOwner = organization.ownerId.equals(inviterUserId);

      if (!isOwner) {
        // Owner가 아니면 organization_members에서 Admin인지 확인
        const inviterRole =
          await this.organizationMemberRepository.findMemberRole(
            new OrganizationId(command.organizationId),
            inviterUserId
          );

        const isAdmin = inviterRole?.value === 'admin';
        if (!isAdmin) {
          console.error('[inviteMember] Unauthorized', {
            userId: command.inviterUserId,
            role: inviterRole?.value,
          });
          return Result.error(
            new OrganizationManagementError(
              'INSUFFICIENT_PERMISSIONS',
              'Only owners and admins can invite members'
            )
          );
        }
      }

      // 3. 중복 초대 확인
      const existingInvitation =
        await this.invitationRepository.findByInviteeEmail(
          command.inviteeEmail,
          new OrganizationId(command.organizationId)
        );

      if (existingInvitation) {
        console.error('[inviteMember] Duplicate invitation', {
          email: command.inviteeEmail,
        });
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_EXISTS',
            'An invitation for this email already exists'
          )
        );
      }

      // 4. 초대받을 사용자가 이미 가입되어 있는지 확인
      const userProfiles =
        await this.organizationMemberRepository.searchUserProfileByEmail(
          command.inviteeEmail
        );
      const inviteeUserId =
        userProfiles.length > 0 ? userProfiles[0]?.userId : null;

      devLog('[inviteMember] Invitee search result', {
        email: command.inviteeEmail,
        found: userProfiles.length > 0,
      });

      // 5. 초대 생성
      const invitation = InvitationAggregate.create(
        new OrganizationId(command.organizationId),
        new UserId(command.inviterUserId),
        command.inviteeEmail,
        inviteeUserId ? new UserId(inviteeUserId) : null,
        new MemberRole(command.role)
      );

      // 6. 초대 저장
      await this.invitationRepository.save(invitation);

      // 7. Notification 생성 (Notification Management Domain)
      if (invitation.entity.inviteeUserId && this.notificationService) {
        const organizationName = organization.entity.name;

        const notificationResult =
          await this.notificationService.createInvitationNotification({
            userId: invitation.entity.inviteeUserId.value,
            invitationId: invitation.id.value,
            organizationName: organizationName,
            inviterName: command.inviterName,
            role: command.role,
          });

        if (notificationResult.isError()) {
          console.error(
            '[inviteMember] Failed to create notification:',
            notificationResult.error
          );
        }
      }

      // 핵심 이벤트 로그
      eventLog('[inviteMember] Success', {
        invitationId: invitation.id.value,
        inviteeEmail: command.inviteeEmail,
        role: command.role,
        hasNotification: !!invitation.entity.inviteeUserId,
      });

      return Result.success(invitation);
    } catch (error) {
      console.error('[inviteMember] Caught error:', error);
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Failed to create invitation',
          { error }
        )
      );
    }
  }

  /**
   * 초대 수락
   */
  async acceptInvitation(
    command: AcceptInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>> {
    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepository.findById(
        new InvitationId(command.invitationId)
      );

      if (!invitation) {
        console.error(
          '[acceptInvitation] Invitation not found:',
          command.invitationId
        );
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_NOT_FOUND',
            'Invitation not found'
          )
        );
      }

      // 2. 초대 상태 확인
      if (!invitation.entity.isPending()) {
        console.error('[acceptInvitation] Already responded', {
          status: invitation.entity.status,
        });
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_RESPONDED',
            'Invitation has already been responded to'
          )
        );
      }

      // 3. 초대 승낙
      const inviteeUserId = new UserId(command.inviteeUserId);
      invitation.acceptInvitation(inviteeUserId);

      // 4. 초대 업데이트
      await this.invitationRepository.save(invitation);

      // 5. organization_members 테이블에 멤버 추가
      await this.organizationMemberRepository.addMember({
        organizationId: invitation.entity.organizationId,
        userId: inviteeUserId,
        role: invitation.entity.role,
        joinedAt: new Date(),
      });

      // 6. 초대받은 사용자 프로필 조회 (개인 워크스페이스 이름 생성용)
      const inviteeProfiles =
        await this.organizationMemberRepository.searchUserProfileByEmail(
          invitation.entity.inviteeEmail
        );
      const inviteeProfile = inviteeProfiles.find(
        profile => profile.userId === command.inviteeUserId
      );
      const inviteeName = inviteeProfile?.name || 'User';

      // 7. 개인 워크스페이스 생성 (v1.2)
      const personalWorkspaceResult =
        await this.workspaceCrudService.createPersonalWorkspace(
          invitation.entity.organizationId,
          command.inviteeUserId,
          inviteeName
        );

      if (!personalWorkspaceResult.success) {
        // 개인 워크스페이스 생성 실패 시 멤버 추가 롤백
        console.error(
          '[acceptInvitation] Personal workspace creation failed, rolling back:',
          personalWorkspaceResult.error
        );
        await this.organizationMemberRepository.removeMember(
          invitation.entity.organizationId,
          inviteeUserId
        );

        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ACCEPTANCE_FAILED',
            `Failed to create personal workspace: ${personalWorkspaceResult.error}`
          )
        );
      }

      // 8. Notification Domain 통합 (알림 읽음 처리)
      if (this.notificationService) {
        await this.notificationService.markAsReadByRelatedId(
          command.invitationId
        );
      }

      // 핵심 이벤트 로그
      eventLog('[acceptInvitation] Success', {
        invitationId: invitation.id.value,
        organizationId: invitation.entity.organizationId.value,
        userId: command.inviteeUserId,
        role: invitation.entity.role.value,
        personalWorkspaceId: personalWorkspaceResult.data.workspaceId,
      });

      return Result.success(undefined);
    } catch (error) {
      console.error('[acceptInvitation] Caught error:', error);
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_ACCEPTANCE_FAILED',
          'Failed to accept invitation',
          { error }
        )
      );
    }
  }

  /**
   * 초대 거절
   */
  async rejectInvitation(
    command: RejectInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>> {
    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepository.findById(
        new InvitationId(command.invitationId)
      );

      if (!invitation) {
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_NOT_FOUND',
            'Invitation not found'
          )
        );
      }

      // 2. 초대 상태 확인
      if (!invitation.entity.isPending()) {
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_RESPONDED',
            'Invitation has already been responded to'
          )
        );
      }

      // 3. 초대 거절
      const inviteeUserId = new UserId(command.inviteeUserId);
      invitation.rejectInvitation(inviteeUserId);

      // 4. 초대 업데이트
      await this.invitationRepository.save(invitation);

      // 5. Notification Domain 통합 (알림 읽음 처리)
      if (this.notificationService) {
        await this.notificationService.markAsReadByRelatedId(
          command.invitationId
        );
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Failed to reject invitation',
          { error }
        )
      );
    }
  }
}
