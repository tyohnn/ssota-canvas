import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultWorkspaceCrudService } from '../workspace-crud.service';
import { DrizzleWorkspaceRepository } from '../../repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../../repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../../repositories/implementations/drizzle-workspace-member.repository';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { MemberRole } from '@/domains/organization-management/shared/value-objects/member-role.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('WorkspaceCrudService Integration Tests (Scenario 2)', () => {
  let service: DefaultWorkspaceCrudService;
  let workspaceRepo: DrizzleWorkspaceRepository;
  let pageRepo: DrizzlePageRepository;
  let workspaceMemberRepo: DrizzleWorkspaceMemberRepository;
  let orgMemberRepo: OrganizationMemberRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;

  beforeEach(async () => {
    // Repositories 초기화
    workspaceRepo = new DrizzleWorkspaceRepository();
    pageRepo = new DrizzlePageRepository();
    workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();

    // Organization Member Repository Stub
    orgMemberRepo = {
      isMember: vi.fn(),
      findMemberRole: vi.fn(),
      searchUserProfileByEmail: vi.fn(),
    } as any;

    // Service 초기화
    service = new DefaultWorkspaceCrudService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // Test data
    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
    }
    
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  afterEach(async () => {
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
    }
    
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('createWorkspace', () => {
    it('조직 소유자가 Workspace를 생성할 수 있어야 한다', async () => {
      // Given: 조직 owner
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('owner')
      );

      // When
      const result = await service.createWorkspace(
        testOrgId,
        '마케팅 팀',
        '마케팅 캠페인 및 콘텐츠 관리',
        '🎨',
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaceId).toBeDefined();
        expect(result.data.firstPageId).toBeDefined();

        // DB 확인: Workspace 생성됨
        const savedWorkspace = await workspaceRepo.findById(
          new WorkspaceId(result.data.workspaceId)
        );
        expect(savedWorkspace).not.toBeNull();
        expect(savedWorkspace?.name).toBe('마케팅 팀');
        expect(savedWorkspace?.description).toBe('마케팅 캠페인 및 콘텐츠 관리');
        expect(savedWorkspace?.icon).toBe('🎨');
        expect(savedWorkspace?.isDefault).toBe(false);
        expect(savedWorkspace?.deletable).toBe(true);

        // DB 확인: 멤버십 추가됨
        const isMember = await workspaceMemberRepo.isMember(
          new WorkspaceId(result.data.workspaceId),
          testUserId
        );
        expect(isMember).toBe(true);

        // DB 확인: 초기 페이지 생성됨
        const initialPage = await pageRepo.findById(
          new PageId(result.data.firstPageId)
        );
        expect(initialPage).not.toBeNull();
        expect(initialPage?.title).toBe('Untitled');
        expect(initialPage?.icon).toBe('📄');
      }
    });

    it('조직 Admin은 Workspace를 생성할 수 없어야 한다', async () => {
      // Given: 조직 admin (owner 아님)
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );

      // When
      const result = await service.createWorkspace(
        testOrgId,
        'Admin Workspace',
        null,
        null,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_OWNER');
      }
    });

    it('조직 일반 멤버는 Workspace를 생성할 수 없어야 한다', async () => {
      // Given: 조직 member
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );

      // When
      const result = await service.createWorkspace(
        testOrgId,
        'Member Workspace',
        null,
        null,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_OWNER');
      }
    });

    it('조직 비멤버는 Workspace를 생성할 수 없어야 한다', async () => {
      // Given: 조직 비멤버
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(null);

      // When
      const result = await service.createWorkspace(
        testOrgId,
        'Outsider Workspace',
        null,
        null,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_OWNER');
      }
    });

    it('빈 이름으로 생성하면 에러를 반환해야 한다', async () => {
      // Given: 조직 owner
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('owner')
      );

      // When: 빈 이름으로 생성 시도
      const result = await service.createWorkspace(
        testOrgId,
        '', // 빈 이름
        null,
        null,
        testUserId
      );

      // Then: 실패 (Aggregate 검증 에러)
      expect(result.success).toBe(false);
      if (!result.success) {
        // 에러 메시지 확인
        expect(result.error).toContain('이름');
      }

      // DB 확인: Workspace가 생성되지 않았어야 함
      const allWorkspaces = await workspaceRepo.findByOrganizationId(testOrgId);
      expect(allWorkspaces).toHaveLength(0);
    });
  });

  describe('updateWorkspaceInfo', () => {
    it('Workspace 멤버가 Workspace 정보를 수정할 수 있어야 한다', async () => {
      // Given: Workspace 생성 및 멤버 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Original Name',
        description: 'Original Description',
        icon: '🏠',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // When
      const result = await service.updateWorkspaceInfo(
        workspace.workspace.workspaceId,
        'Updated Name',
        'Updated Description',
        '🚀',
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      // DB 확인: 정보 업데이트됨
      const updated = await workspaceRepo.findById(workspace.workspace.workspaceId);
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated Description');
      expect(updated?.icon).toBe('🚀');
    });

    it('이름만 수정할 수 있어야 한다', async () => {
      // Given: Workspace 생성 및 멤버 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Original Name',
        description: 'Original Description',
        icon: '🏠',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // When: 이름만 수정
      const result = await service.updateWorkspaceInfo(
        workspace.workspace.workspaceId,
        'New Name Only',
        undefined, // 변경 없음
        undefined, // 변경 없음
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      // DB 확인: 이름만 변경됨
      const updated = await workspaceRepo.findById(workspace.workspace.workspaceId);
      expect(updated?.name).toBe('New Name Only');
      expect(updated?.description).toBe('Original Description'); // 유지
      expect(updated?.icon).toBe('🏠'); // 유지
    });

    it('Workspace 멤버가 아니면 수정할 수 없어야 한다', async () => {
      // Given: Workspace 생성 (멤버 추가 안함)
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Private Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      // When
      const result = await service.updateWorkspaceInfo(
        workspace.workspace.workspaceId,
        'Hacked Name',
        null,
        null,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }

      // DB 확인: 정보가 변경되지 않았어야 함
      const notUpdated = await workspaceRepo.findById(workspace.workspace.workspaceId);
      expect(notUpdated?.name).toBe('Private Workspace');
    });

    it('존재하지 않는 Workspace는 에러를 반환해야 한다', async () => {
      // Given: 존재하지 않는 Workspace ID
      const nonExistentId = new WorkspaceId('999e8400-e29b-41d4-a716-446655440000');

      // When
      const result = await service.updateWorkspaceInfo(
        nonExistentId,
        'New Name',
        null,
        null,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('WORKSPACE_NOT_FOUND');
      }
    });

    it('빈 이름으로 수정하면 에러를 반환해야 한다', async () => {
      // Given: Workspace 생성 및 멤버 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Valid Name',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // When: 빈 이름으로 수정 시도
      const result = await service.updateWorkspaceInfo(
        workspace.workspace.workspaceId,
        '', // 빈 이름
        null,
        null,
        testUserId
      );

      // Then: 실패 (Aggregate에서 검증 에러 발생)
      expect(result.success).toBe(false);

      // DB 확인: 원래 이름 유지
      const notUpdated = await workspaceRepo.findById(workspace.workspace.workspaceId);
      expect(notUpdated?.name).toBe('Valid Name');
    });
  });
});

