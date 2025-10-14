// apps/web/src/domains/workspace-management/backend/services/workspace-crud.service.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { WorkspaceRepository } from '../repositories/interfaces/workspace.repository.interface';
import type { PageRepository } from '../repositories/interfaces/page.repository.interface';
import type { WorkspaceMemberRepository } from '../repositories/interfaces/workspace-member.repository.interface';
import type { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import type { WorkspaceCrudService } from './interfaces/workspace-crud.service.interface';
import type { CreateWorkspaceResult, Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { WorkspaceAggregate } from '../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { adminDb } from '@/db';

/**
 * Workspace CRUD Service Implementation (Scenario 0, 2)
 *
 * Workspace 생성 및 정보 수정을 담당
 */
export class DefaultWorkspaceCrudService implements WorkspaceCrudService {
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private pageRepo: PageRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository,
    private orgMemberRepo: OrganizationMemberRepository
  ) {}

  /**
   * Default Workspace 생성 (Scenario 0)
   *
   * 트랜잭션:
   * 1. Default Workspace 생성 (삭제 불가)
   * 2. 생성자를 Workspace 멤버로 추가
   * 3. 초기 "Welcome 👋" 페이지 생성
   *
   * @param orgId - 조직 ID
   * @param userId - 사용자 ID (조직 소유자)
   * @returns CreateWorkspaceResult (성공) | Error code (실패)
   */
  async createDefaultWorkspace(
    orgId: OrganizationId,
    userId: string
  ): Promise<Result<CreateWorkspaceResult>> {
    try {
      // 1. Default Workspace Aggregate 생성
      const workspaceAgg = WorkspaceAggregate.createDefault({
        organizationId: orgId.value,
        createdBy: userId,
      });

      // 2. Welcome Page Aggregate 생성
      const pageAgg = PageAggregate.create(
        {
          workspaceId: workspaceAgg.workspace.workspaceId.value,
          parentId: undefined, // 최상위
          title: 'Welcome',
          icon: 'Sparkles', // Lucide icon name
          createdBy: userId,
        },
        null // parentPage
      );

      // 3. 트랜잭션: Workspace + Membership + Welcome Page 생성
      await adminDb.transaction(async tx => {
        try {
          // 3-1. Workspace 저장
          await this.workspaceRepo.save(workspaceAgg);
          console.log(
            '[WorkspaceCrudService] Workspace created:',
            workspaceAgg.workspace.workspaceId.value
          );

          // 3-2. 생성자를 Workspace 멤버로 추가
          await this.workspaceMemberRepo.addMember(
            workspaceAgg.workspace.workspaceId,
            userId
          );
          console.log('[WorkspaceCrudService] Workspace member added:', userId);

          // 3-3. Welcome 페이지 저장
          await this.pageRepo.save(pageAgg);
          console.log(
            '[WorkspaceCrudService] Welcome page created:',
            pageAgg.page.pageId.value
          );
        } catch (error) {
          console.error(
            '[WorkspaceCrudService] Transaction failed, auto-rollback triggered:',
            error
          );
          throw error; // 트랜잭션 롤백 트리거
        }
      });

      // 4. Result.ok 반환 (workspaceId, workspace 정보, 페이지 정보)
      console.log(
        '[WorkspaceCrudService] Default workspace creation completed successfully'
      );
      return R.ok({
        workspaceId: workspaceAgg.workspace.workspaceId.value,
        workspaceName: workspaceAgg.workspace.name,
        workspaceIsDefault: workspaceAgg.workspace.isDefault,
        firstPageId: pageAgg.page.pageId.value,
        firstPageTitle: pageAgg.page.title,
        firstPageIcon: pageAgg.page.icon,
      });
    } catch (error) {
      // 5. Validation 에러 처리 (Aggregate에서 발생)
      console.error(
        '[WorkspaceCrudService] Default workspace creation failed:',
        error
      );

      if (error instanceof Error) {
        return R.err(`WORKSPACE_CREATION_FAILED: ${error.message}`);
      }
      return R.err('UNKNOWN_ERROR');
    }
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
  ): Promise<Result<CreateWorkspaceResult>> {
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
          icon: 'File',
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

      // 5. Result.ok 반환 (workspaceId, workspace 정보, 페이지 정보)
      return R.ok({
        workspaceId: workspaceAgg.workspace.workspaceId.value,
        workspaceName: workspaceAgg.workspace.name,
        workspaceIsDefault: workspaceAgg.workspace.isDefault,
        firstPageId: pageAgg.page.pageId.value,
        firstPageTitle: pageAgg.page.title,
        firstPageIcon: pageAgg.page.icon,
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
}
