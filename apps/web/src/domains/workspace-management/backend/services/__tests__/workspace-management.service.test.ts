import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultWorkspaceManagementService } from '../workspace-management.service';
import { DrizzleWorkspaceRepository } from '../../repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../../repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../../repositories/implementations/drizzle-workspace-member.repository';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { MemberRole } from '@/domains/organization-management/shared/value-objects/member-role.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('WorkspaceManagementService Integration Tests', () => {
  let service: DefaultWorkspaceManagementService;
  let workspaceRepo: DrizzleWorkspaceRepository;
  let pageRepo: DrizzlePageRepository;
  let workspaceMemberRepo: DrizzleWorkspaceMemberRepository;
  let orgMemberRepo: OrganizationMemberRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;
  let testWorkspaceId: WorkspaceId;

  beforeEach(async () => {
    // Repositories 초기화
    workspaceRepo = new DrizzleWorkspaceRepository();
    pageRepo = new DrizzlePageRepository();
    workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();

    // Organization Member Repository Stub
    orgMemberRepo = {
      isMember: vi.fn(),
      findMemberRole: vi.fn(),
    } as any;

    // Service 초기화
    service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo
    );

    // Test data
    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up (FK 순서: pages → workspace_members → workspaces)
    // 1. 먼저 해당 조직의 workspace들을 찾는다
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    // 2. 각 workspace의 pages 삭제
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
    }
    
    // 3. workspace_members 삭제
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    
    // 4. workspaces 삭제
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));

    // Setup: Default Workspace 생성
    const workspaceAggregate = WorkspaceAggregate.createDefault({
      organizationId: testOrgId.value,
      createdBy: testUserId,
    });
    await workspaceRepo.save(workspaceAggregate);
    testWorkspaceId = workspaceAggregate.workspace.workspaceId;

    // Setup: 페이지 생성
    const page1 = PageAggregate.create(
      {
        workspaceId: testWorkspaceId.value,
        title: 'Welcome Page',
        icon: '📄',
        createdBy: testUserId,
      },
      null
    );
    await pageRepo.save(page1);

    const page2 = PageAggregate.create(
      {
        workspaceId: testWorkspaceId.value,
        title: 'Getting Started',
        createdBy: testUserId,
      },
      null
    );
    await pageRepo.save(page2);
  });

  afterEach(async () => {
    // Clean up (FK 순서: pages → workspace_members → workspaces)
    // 1. 먼저 해당 조직의 workspace들을 찾는다
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    // 2. 각 workspace의 pages 삭제
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
    }
    
    // 3. workspace_members 삭제
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    
    // 4. workspaces 삭제
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('getOrganizationWorkspacePageView', () => {
    it('조직 멤버가 Workspace-Page 목록을 조회할 수 있어야 한다', async () => {
      // Given: 조직 멤버
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);

      // When
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizationId).toBe(testOrgId.value);
        expect(result.data.workspaces).toHaveLength(1);
        expect(result.data.workspaces[0]?.pageTree).toHaveLength(2);
        expect(result.data.workspaces[0]?.isDefault).toBe(true);
      }
    });

    it('조직 비멤버는 접근할 수 없어야 한다', async () => {
      // Given: 조직 비멤버
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(false);

      // When
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_MEMBER');
      }
    });

    it('쿠키 페이지가 유효하면 선택되어야 한다', async () => {
      // Given: 조직 멤버 + 유효한 쿠키 페이지
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);
      const allPages = await pageRepo.findTreeByWorkspaceId(testWorkspaceId);
      const validPageId = allPages[0]?.pageId.value;

      // When
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId,
        validPageId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedPageId).toBe(validPageId);
      }
    });

    it('쿠키 페이지가 없으면 Default Workspace 첫 페이지가 선택되어야 한다', async () => {
      // Given: 조직 멤버 + 쿠키 없음
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);

      // When
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedPageId).toBeDefined();
        expect(result.data.workspaces[0]?.pageTree[0]?.pageId.value).toBe(
          result.data.selectedPageId
        );
      }
    });

    it('쿠키 페이지가 무효하면 Default Workspace 첫 페이지로 Fallback 해야 한다', async () => {
      // Given: 조직 멤버 + 무효한 쿠키 페이지
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);
      const invalidPageId = '999e8400-e29b-41d4-a716-446655440000';

      // When
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId,
        invalidPageId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedPageId).not.toBe(invalidPageId);
        expect(result.data.selectedPageId).toBe(
          result.data.workspaces[0]?.pageTree[0]?.pageId.value
        );
      }
    });
  });

  describe('verifyPageAccess', () => {
    it('조직 멤버는 Default Workspace의 페이지에 접근할 수 있어야 한다', async () => {
      // Given: 조직 member role
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );
      const allPages = await pageRepo.findTreeByWorkspaceId(testWorkspaceId);
      const pageId = new PageId(allPages[0]!.pageId.value);

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        testWorkspaceId,
        pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page.pageId.equals(pageId)).toBe(true);
        expect(result.data.userRole).toBe('member');
      }
    });

    it('조직 비멤버는 페이지에 접근할 수 없어야 한다', async () => {
      // Given: 조직 비멤버
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(null);
      const allPages = await pageRepo.findTreeByWorkspaceId(testWorkspaceId);
      const pageId = new PageId(allPages[0]!.pageId.value);

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        testWorkspaceId,
        pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_MEMBER');
      }
    });

    it('일반 Workspace는 초대받은 멤버만 접근할 수 있어야 한다', async () => {
      // Given: 일반 Workspace 생성
      const normalWorkspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Team Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(normalWorkspace);

      const normalPage = PageAggregate.create(
        {
          workspaceId: normalWorkspace.workspace.workspaceId.value,
          title: 'Private Page',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(normalPage);

      // Given: 조직 멤버이지만 Workspace 초대 안됨
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        normalWorkspace.workspace.workspaceId,
        normalPage.page.pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }
    });

    it('일반 Workspace에 초대받은 멤버는 접근할 수 있어야 한다', async () => {
      // Given: 일반 Workspace 생성
      const normalWorkspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Team Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(normalWorkspace);

      const normalPage = PageAggregate.create(
        {
          workspaceId: normalWorkspace.workspace.workspaceId.value,
          title: 'Private Page',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(normalPage);

      // Given: Workspace에 초대
      await workspaceMemberRepo.addMember(
        normalWorkspace.workspace.workspaceId,
        testUserId
      );

      // Given: 조직 admin role
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        normalWorkspace.workspace.workspaceId,
        normalPage.page.pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page.pageId.equals(normalPage.page.pageId)).toBe(
          true
        );
        expect(result.data.userRole).toBe('admin');
      }
    });

    it('존재하지 않는 Workspace는 에러를 반환해야 한다', async () => {
      // Given: 조직 멤버
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );
      const nonExistentWorkspaceId = new WorkspaceId(
        '999e8400-e29b-41d4-a716-446655440000'
      );
      const allPages = await pageRepo.findTreeByWorkspaceId(testWorkspaceId);
      const pageId = new PageId(allPages[0]!.pageId.value);

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        nonExistentWorkspaceId,
        pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('WORKSPACE_NOT_FOUND');
      }
    });

    it('존재하지 않는 Page는 에러를 반환해야 한다', async () => {
      // Given: 조직 멤버
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );
      const nonExistentPageId = new PageId(
        '999e8400-e29b-41d4-a716-446655440000'
      );

      // When
      const result = await service.verifyPageAccess(
        testOrgId,
        testWorkspaceId,
        nonExistentPageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('PAGE_NOT_FOUND');
      }
    });
  });

  // Scenario 2: Workspace 생성 및 정보 수정
  describe('createWorkspace (Scenario 2)', () => {
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
      // Default Workspace 1개만 있어야 함 (beforeEach에서 생성)
      expect(allWorkspaces).toHaveLength(1);
      expect(allWorkspaces[0]?.isDefault).toBe(true);
    });
  });

  describe('updateWorkspaceInfo (Scenario 2)', () => {
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

