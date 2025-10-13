// apps/web/src/domains/workspace-management/backend/services/workspace-invitation.service.ts

import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { NotificationRepository } from '@/domains/notification-management/backend/repositories/interfaces/notification.repository.interface';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import type { WorkspaceRepository } from '../repositories/interfaces/workspace.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { IWorkspaceInvitationRepository } from '../repositories/interfaces/workspace-invitation.repository.interface';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import { WorkspaceInvitationId } from '../../shared/value-objects/workspace-invitation-id.vo';
import type { WorkspaceInvitationService } from './interfaces/workspace-invitation.service.interface';
import type { Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { WorkspaceAggregate } from '../../shared/aggregates/workspace.aggregate';
import { isWorkspaceManagementError } from '../../shared/errors/workspace-management.error';

/**
 * Workspace Invitation Service Implementation (Scenario 3)
 *
 * Workspace 멤버 초대, 수락, 거절을 담당
 */
export class DefaultWorkspaceInvitationService
  implements WorkspaceInvitationService
{
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository,
    private orgMemberRepo: OrganizationMemberRepository,
    private orgRepo: OrganizationRepository,
    private invitationRepo?: IWorkspaceInvitationRepository,
    private notificationRepo?: NotificationRepository
  ) {}

  /**
   * Workspace 멤버 초대 (Scenario 3)
   *
   * @param workspaceId - Workspace ID
   * @param memberEmails - 초대할 멤버 이메일 배열
   * @param userId - 초대하는 사용자 ID
   * @returns 초대한 멤버 수 (성공) | Error code (실패)
   */
  async inviteWorkspaceMembers(
    workspaceId: WorkspaceId,
    memberEmails: string[],
    userId: string
  ): Promise<Result<number>> {
    try {
      // 1. Workspace 조회
      const workspace = await this.workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return R.err('WORKSPACE_NOT_FOUND');
      }

      // 2. 조직 Admin 권한 확인
      const orgMemberRole = await this.orgMemberRepo.findMemberRole(
        workspace.organizationId,
        new UserId(userId)
      );

      if (!orgMemberRole) {
        return R.err('NOT_ORG_MEMBER');
      }

      const isAdmin =
        orgMemberRole.value === 'admin' || orgMemberRole.value === 'owner';
      if (!isAdmin) {
        return R.err('NOT_ORG_ADMIN');
      }

      // 3. Workspace 멤버십 확인
      const isWorkspaceMember = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isWorkspaceMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 4. Workspace Aggregate 재구성
      const workspaceAgg = new WorkspaceAggregate(workspace);

      // 5. 각 이메일에 대해 초대 처리
      let invitedCount = 0;

      // 5.1. 초대한 사람의 프로필 조회 (알림 메시지용)
      const inviterProfiles =
        await this.orgMemberRepo.searchUserProfileByEmail(userId);
      const inviterProfile = inviterProfiles[0];
      const inviterName = inviterProfile?.name || '관리자';

      // 5.2. 조직 정보 조회 (알림 메시지용) - Repository 사용
      const organizationName =
        (await this.orgRepo.getOrganizationName(workspace.organizationId)) ||
        'Unknown Organization';

      for (const email of memberEmails) {
        try {
          // a) Organization Member Repository에서 이메일로 사용자 검색
          const userProfiles =
            await this.orgMemberRepo.searchUserProfileByEmail(email);

          if (userProfiles.length === 0) {
            console.warn(`User not found for email: ${email}`);
            continue;
          }

          const targetUser = userProfiles[0];

          // b) Organization 멤버인지 확인
          const isOrgMember = await this.orgMemberRepo.isMember(
            workspace.organizationId,
            new UserId(targetUser!.userId)
          );

          if (!isOrgMember) {
            console.warn(`User ${email} is not an organization member`);
            continue;
          }

          // c) 이미 Workspace 멤버인지 확인
          const isAlreadyMember = await this.workspaceMemberRepo.isMember(
            workspaceId,
            targetUser!.userId
          );

          if (isAlreadyMember) {
            console.warn(`User ${email} is already a workspace member`);
            continue;
          }

          // d) Aggregate를 통한 초대 생성 (Domain Logic)
          const invitation = workspaceAgg.inviteMember(
            targetUser!.userId,
            userId,
            isAdmin, // isInviterAdmin
            isWorkspaceMember, // isInviterWorkspaceMember
            isAlreadyMember // 이미 확인한 값
          );

          // e) 초대 저장 (Repository)
          if (this.invitationRepo) {
            await this.invitationRepo.save(invitation);
          }

          // f) Notification 발송 (Optional - 실패해도 초대는 생성됨)
          if (this.notificationRepo) {
            try {
              const notificationService = new NotificationService(
                this.notificationRepo
              );
              await notificationService.createWorkspaceInvitationNotification({
                userId: targetUser!.userId,
                workspaceInvitationId: invitation.id.value,
                workspaceName: workspace.name,
                workspaceDescription: workspace.description,
                inviterName,
                organizationName,
              });
            } catch (notificationError) {
              // 알림 발송 실패는 로그만 남기고 진행
              console.error(
                `Failed to send notification for ${email}:`,
                notificationError
              );
            }
          }

          invitedCount++;
        } catch (error) {
          // 개별 초대 실패는 로그만 남기고 다음으로 진행
          console.error(`Failed to invite ${email}:`, error);
        }
      }

      // 6. Result.ok 반환 (초대한 멤버 수)
      return R.ok(invitedCount);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Workspace 초대 수락 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 수락하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  async acceptWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>> {
    if (!this.invitationRepo) {
      return R.err('INVITATION_REPOSITORY_NOT_CONFIGURED');
    }

    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepo.findById(
        new WorkspaceInvitationId(invitationId)
      );
      if (!invitation) {
        return R.err('INVITATION_NOT_FOUND');
      }

      // 2. Workspace 조회
      const workspace = await this.workspaceRepo.findById(
        invitation.workspaceId
      );
      if (!workspace) {
        return R.err('WORKSPACE_NOT_FOUND');
      }

      // 3. Workspace Aggregate 재구성
      const workspaceAgg = new WorkspaceAggregate(workspace);

      // 4. acceptInvitation 호출
      const isInvitee = invitation.invitedUserId === userId;
      const isAlreadyProcessed = invitation.status !== 'pending';

      workspaceAgg.acceptInvitation(
        invitationId,
        userId,
        isInvitee,
        isAlreadyProcessed
      );

      // 5. 초대 상태 업데이트
      invitation.accept();
      await this.invitationRepo.save(invitation);

      // 6. Workspace 멤버로 추가
      await this.workspaceMemberRepo.addMember(invitation.workspaceId, userId);

      // 7. TODO: Notification Domain 통합 (알림 업데이트)

      return R.ok(undefined);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Workspace 초대 거절 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 거절하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  async rejectWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>> {
    if (!this.invitationRepo) {
      return R.err('INVITATION_REPOSITORY_NOT_CONFIGURED');
    }

    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepo.findById(
        new WorkspaceInvitationId(invitationId)
      );
      if (!invitation) {
        return R.err('INVITATION_NOT_FOUND');
      }

      // 2. Workspace 조회
      const workspace = await this.workspaceRepo.findById(
        invitation.workspaceId
      );
      if (!workspace) {
        return R.err('WORKSPACE_NOT_FOUND');
      }

      // 3. Workspace Aggregate 재구성
      const workspaceAgg = new WorkspaceAggregate(workspace);

      // 4. rejectInvitation 호출
      const isInvitee = invitation.invitedUserId === userId;
      const isAlreadyProcessed = invitation.status !== 'pending';

      workspaceAgg.rejectInvitation(
        invitationId,
        userId,
        isInvitee,
        isAlreadyProcessed
      );

      // 5. 초대 상태 업데이트
      invitation.reject();
      await this.invitationRepo.save(invitation);

      // 6. TODO: Notification Domain 통합 (알림 업데이트)

      return R.ok(undefined);
    } catch (error) {
      if (isWorkspaceManagementError(error)) {
        return R.err(error.code);
      }
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }
}
