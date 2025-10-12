// apps/web/src/domains/workspace-management/backend/services/workspace-management.service.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { NotificationRepository } from '@/domains/notification-management/backend/repositories/interfaces/notification.repository.interface';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import type { WorkspaceRepository } from '../repositories/interfaces/workspace.repository.interface';
import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { IWorkspaceInvitationRepository } from '../repositories/interfaces/workspace-invitation.repository.interface';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import { WorkspaceInvitationId } from '../../shared/value-objects/workspace-invitation-id.vo';
import type { PageId } from '../../shared/value-objects/page-id.vo';
import type {
  WorkspaceManagementService,
  OrganizationWorkspacePageView,
  WorkspaceWithPages,
  PageAccessResult,
  Result,
} from './interfaces/workspace-management.service.interface';
import { Result as R } from './interfaces/workspace-management.service.interface';
import { WorkspaceAggregate } from '../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { isWorkspaceManagementError } from '../../shared/errors/workspace-management.error';
import { adminDb } from '@/db';

/**
 * Default Workspace Management Service Implementation
 *
 * Workspace 및 Page Aggregate를 조율하고 Organization Domain과 통합하는 서비스
 */
export class DefaultWorkspaceManagementService
  implements WorkspaceManagementService
{
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private pageRepo: PageRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository,
    private orgMemberRepo: OrganizationMemberRepository,
    private orgRepo: OrganizationRepository,
    private invitationRepo?: IWorkspaceInvitationRepository,
    private notificationRepo?: NotificationRepository
  ) {}

  /**
   * 조직의 Workspace-Page 목록 조회
   *
   * @param orgId - 조직 ID
   * @param userId - 사용자 ID
   * @param cookiePageId - 쿠키에 저장된 최근 방문 페이지 ID (선택)
   * @returns OrganizationWorkspacePageView (성공) | Error code (실패)
   */
  async getOrganizationWorkspacePageView(
    orgId: OrganizationId,
    userId: string,
    cookiePageId?: string
  ): Promise<Result<OrganizationWorkspacePageView>> {
    // 1. 조직 멤버십 확인 (Fail-fast)
    const isOrgMember = await this.orgMemberRepo.isMember(
      orgId,
      new UserId(userId)
    );
    if (!isOrgMember) {
      return R.err('NOT_ORG_MEMBER');
    }

    // 2. Workspace 목록 조회 (Default 우선 정렬)
    const workspaces = await this.workspaceRepo.findByOrganizationId(orgId);

    // 3. 각 Workspace의 Page 트리 조회 (재귀 CTE)
    const workspacesWithPages: WorkspaceWithPages[] = await Promise.all(
      workspaces.map(async ws => {
        const pageTree = await this.pageRepo.findTreeByWorkspaceId(
          ws.workspaceId
        );
        return {
          workspaceId: ws.workspaceId.value,
          name: ws.name,
          description: ws.description,
          icon: ws.icon,
          isDefault: ws.isDefault,
          pageTree,
          pageCount: pageTree.length,
        };
      })
    );

    // 4. 쿠키 검증 및 Fallback
    let selectedPageId: string | null = null;

    if (cookiePageId) {
      // 쿠키에 저장된 페이지 검증
      const cookiePage = await this.pageRepo.findById({
        value: cookiePageId,
      } as PageId);

      // 쿠키 페이지가 유효한지 확인 (존재 && 해당 조직의 Workspace에 속함)
      const belongsToOrg = cookiePage
        ? workspacesWithPages.some(ws =>
            ws.pageTree.some(p => p.pageId.value === cookiePageId)
          )
        : false;

      if (cookiePage && belongsToOrg) {
        selectedPageId = cookiePageId;
      } else {
        // 무효한 쿠키 → Fallback
        selectedPageId =
          this.findDefaultWorkspaceFirstPage(workspacesWithPages);
      }
    } else {
      // 쿠키 없음 → Fallback
      selectedPageId = this.findDefaultWorkspaceFirstPage(workspacesWithPages);
    }

    // 5. OrganizationWorkspacePageView 반환
    return R.ok({
      organizationId: orgId.value,
      workspaces: workspacesWithPages,
      selectedPageId,
    });
  }

  /**
   * Page 접근 권한 검증
   *
   * @param orgId - 조직 ID
   * @param workspaceId - Workspace ID
   * @param pageId - Page ID
   * @param userId - 사용자 ID
   * @returns PageAccessResult (성공) | Error code (실패)
   */
  async verifyPageAccess(
    orgId: OrganizationId,
    workspaceId: WorkspaceId,
    pageId: PageId,
    userId: string
  ): Promise<Result<PageAccessResult>> {
    // 1. 조직 멤버십 및 권한 확인 (Fail-fast)
    const orgMemberRole = await this.orgMemberRepo.findMemberRole(
      orgId,
      new UserId(userId)
    );
    if (!orgMemberRole) {
      return R.err('NOT_ORG_MEMBER');
    }

    // 2. Workspace 조회
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return R.err('WORKSPACE_NOT_FOUND');
    }

    // 3. Workspace 초대 여부 확인 (Default는 자동 허용)
    if (workspace.isDefault) {
      // Default Workspace는 조직 멤버 자동 접근
    } else {
      // 일반 Workspace는 초대 여부 확인
      const isInvited = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isInvited) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }
    }

    // 4. Page 조회
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return R.err('PAGE_NOT_FOUND');
    }

    // 5. Page가 해당 Workspace에 속하는지 확인
    if (!page.workspaceId.equals(workspaceId)) {
      return R.err('BAD_REQUEST');
    }

    // 6. Result.ok with userRole (조직 role 반환)
    return R.ok({
      page,
      userRole: orgMemberRole.value,
    });
  }

  /**
   * Workspace 생성 (Scenario 2)
   *
   * 트랜잭션:
   * 1. Workspace 생성
   * 2. 생성자를 Workspace 멤버로 추가
   * 3. 초기 "Untitled" 페이지 생성
   *
   * @param orgId - 조직 ID
   * @param name - Workspace 이름 (1-100자)
   * @param description - Workspace 설명 (최대 500자)
   * @param icon - Workspace 아이콘
   * @param userId - 사용자 ID
   * @returns CreateWorkspaceResult (성공) | Error code (실패)
   */
  async createWorkspace(
    orgId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    userId: string
  ): Promise<Result<{ workspaceId: string; firstPageId: string }>> {
    try {
      // 1. 조직 소유자 권한 확인
      const orgMemberRole = await this.orgMemberRepo.findMemberRole(
        orgId,
        new UserId(userId)
      );
      if (!orgMemberRole || orgMemberRole.value !== 'owner') {
        return R.err('NOT_ORG_OWNER');
      }

      // 2. Workspace Aggregate 생성
      const workspaceAgg = WorkspaceAggregate.create({
        organizationId: orgId.value,
        name,
        description: description || undefined,
        icon: icon || undefined,
        createdBy: userId,
      });

      // 3. Page Aggregate 생성 (초기 "Untitled" 페이지)
      const pageAgg = PageAggregate.create(
        {
          workspaceId: workspaceAgg.workspace.workspaceId.value,
          parentId: undefined, // 최상위
          title: 'Untitled',
          icon: '📄',
          createdBy: userId,
        },
        null // parentPage
      );

      // 4. 트랜잭션: Workspace + Membership + Page 생성
      await adminDb.transaction(async tx => {
        // 4-1. Workspace 저장
        await this.workspaceRepo.save(workspaceAgg);

        // 4-2. 생성자를 Workspace 멤버로 추가
        await this.workspaceMemberRepo.addMember(
          workspaceAgg.workspace.workspaceId,
          userId
        );

        // 4-3. 초기 페이지 저장
        await this.pageRepo.save(pageAgg);
      });

      // 5. Result.ok 반환 (workspaceId, firstPageId)
      return R.ok({
        workspaceId: workspaceAgg.workspace.workspaceId.value,
        firstPageId: pageAgg.page.pageId.value,
      });
    } catch (error) {
      // 6. Validation 에러 처리 (Aggregate에서 발생)
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Workspace 정보 수정 (Scenario 2)
   *
   * @param workspaceId - Workspace ID
   * @param name - 새 이름 (선택)
   * @param description - 새 설명 (선택)
   * @param icon - 새 아이콘 (선택)
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  async updateWorkspaceInfo(
    workspaceId: WorkspaceId,
    name: string | undefined,
    description: string | null | undefined,
    icon: string | null | undefined,
    userId: string
  ): Promise<Result<void>> {
    try {
      // 1. Workspace 조회
      const workspace = await this.workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return R.err('WORKSPACE_NOT_FOUND');
      }

      // 2. Workspace 멤버십 확인
      const isMember = await this.workspaceMemberRepo.isMember(
        workspaceId,
        userId
      );
      if (!isMember) {
        return R.err('NOT_WORKSPACE_MEMBER');
      }

      // 3. Workspace Aggregate 재구성
      const workspaceAgg = new WorkspaceAggregate(workspace);

      // 4. updateInfo 호출 (변경된 필드만 업데이트)
      const finalName = name ?? workspace.name;
      const finalDescription =
        description !== undefined ? description : workspace.description;
      const finalIcon = icon !== undefined ? icon : workspace.icon;

      workspaceAgg.updateInfo(finalName, finalDescription, finalIcon);

      // 5. Workspace 저장
      await this.workspaceRepo.save(workspaceAgg);

      // 6. Result.ok 반환
      return R.ok(undefined);
    } catch (error) {
      // 7. Validation 에러 처리 (Aggregate에서 발생)
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }

  /**
   * Default Workspace의 첫 번째 페이지 ID를 찾는다
   *
   * @param workspaces - Workspace 목록
   * @returns 첫 페이지 ID 또는 null
   */
  private findDefaultWorkspaceFirstPage(
    workspaces: WorkspaceWithPages[]
  ): string | null {
    const defaultWorkspace = workspaces.find(ws => ws.isDefault);
    return defaultWorkspace?.pageTree[0]?.pageId.value || null;
  }

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
