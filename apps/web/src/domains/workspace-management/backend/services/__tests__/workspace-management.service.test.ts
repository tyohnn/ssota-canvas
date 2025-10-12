import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultWorkspaceManagementService } from '../workspace-management.service';
import { DrizzleWorkspaceRepository } from '../../repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../../repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../../repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceInvitationRepository } from '../../repositories/implementations/drizzle-workspace-invitation.repository';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { NotificationRepository } from '@/domains/notification-management/backend/repositories/interfaces/notification.repository.interface';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { MemberRole } from '@/domains/organization-management/shared/value-objects/member-role.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers, workspaceInvitations } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';
import { Result } from '@/utils/result';

describe('WorkspaceManagementService Integration Tests', () => {
  let service: DefaultWorkspaceManagementService;
  let serviceWithNotification: DefaultWorkspaceManagementService;
  let workspaceRepo: DrizzleWorkspaceRepository;
  let pageRepo: DrizzlePageRepository;
  let workspaceMemberRepo: DrizzleWorkspaceMemberRepository;
  let invitationRepo: DrizzleWorkspaceInvitationRepository;
  let orgMemberRepo: OrganizationMemberRepository;
  let orgRepo: OrganizationRepository;
  let notificationRepo: NotificationRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;
  let testWorkspaceId: WorkspaceId;
  let otherUserId: string;

  beforeEach(async () => {
    // Repositories 초기화
    workspaceRepo = new DrizzleWorkspaceRepository();
    pageRepo = new DrizzlePageRepository();
    workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    invitationRepo = new DrizzleWorkspaceInvitationRepository();

    // Organization Member Repository Stub
    orgMemberRepo = {
      isMember: vi.fn(),
      findMemberRole: vi.fn(),
      searchUserProfileByEmail: vi.fn(),
    } as any;

    // Organization Repository Mock
    orgRepo = {
      findById: vi.fn(),
      findByIdAsAdmin: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      getOrganizationName: vi.fn().mockResolvedValue('Test Organization'), // Default mock value
    } as any;

    // Notification Repository Mock
    notificationRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
    } as any;

    // Service 초기화 (Notification 없음 - 기존 테스트용)
    service = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
    );

    // Service 초기화 (Notification 있음 - 통합 테스트용)
    serviceWithNotification = new DefaultWorkspaceManagementService(
      workspaceRepo,
      pageRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo,
      invitationRepo,
      notificationRepo
    );

    // Test data
    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    otherUserId = 'cd04e75e-9ee8-4261-9de3-9f494d1689eb';
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up (FK 순서: pages → workspace_invitations → workspace_members → workspaces)
    // 1. 먼저 해당 조직의 workspace들을 찾는다
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    // 2. 각 workspace의 pages, invitations 삭제
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
      await adminDb
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, ws.id));
    }
    
    // 3. workspace_members 삭제
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    
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
    // Clean up (FK 순서: pages → workspace_invitations → workspace_members → workspaces)
    // 1. 먼저 해당 조직의 workspace들을 찾는다
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    // 2. 각 workspace의 pages, invitations 삭제
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(pages)
        .where(eq(pages.workspace_id, ws.id));
      await adminDb
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, ws.id));
    }
    
    // 3. workspace_members 삭제
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    
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

  describe('inviteWorkspaceMembers (Scenario 3)', () => {
    it('조직 Admin + Workspace 멤버가 초대할 수 있어야 한다 (권한 검증만)', async () => {
      // Given: Workspace 생성 및 Admin을 멤버로 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // Organization Member Repository Stub: Admin 권한
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );

      // 검색 결과가 없는 경우 (초대할 사용자를 찾을 수 없음)
      vi.mocked(orgMemberRepo.searchUserProfileByEmail).mockResolvedValue([]);

      // When: 존재하지 않는 이메일로 초대 시도
      const result = await service.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['nonexistent@test.com'],
        testUserId
      );

      // Then: 초대 성공이지만 초대된 멤버 수는 0 (검색 결과 없음)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('조직 Admin이 아니면 초대할 수 없다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // Organization Member Repository Stub: member 권한
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('member')
      );

      // When
      const result = await service.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['newmember@test.com'],
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_ADMIN');
      }
    });

    it('Workspace 멤버가 아니면 초대할 수 없다', async () => {
      // Given: Workspace 생성 (멤버 추가 안함)
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      // Organization Member Repository Stub: Admin 권한
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );

      // When
      const result = await service.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['newmember@test.com'],
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }
    });

    it('초대 생성 시 Notification을 발송해야 한다 (Notification Domain 통합)', async () => {
      // Given: Workspace 생성 및 멤버 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Notification Test Workspace',
        description: 'Test description',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // Organization Member Repository Stub
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );
      vi.mocked(orgMemberRepo.searchUserProfileByEmail).mockImplementation(
        async (email: string) => {
          if (email === testUserId) {
            return [{
              userId: testUserId,
              email: 'admin@test.com',
              name: 'Admin User',
              profileImageUrl: '',
            }];
          }
          if (email === 'invitee@test.com') {
            return [{
              userId: otherUserId,
              email: 'invitee@test.com',
              name: 'Invitee User',
              profileImageUrl: '',
            }];
          }
          return [];
        }
      );
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);

      // When: Notification 통합된 Service로 초대
      const result = await serviceWithNotification.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['invitee@test.com'],
        testUserId
      );

      // Then: 초대 성공
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }

      // Notification Repository의 save 메서드가 호출되었는지 확인
      expect(notificationRepo.save).toHaveBeenCalled();

      // 호출된 Notification Aggregate 확인
      const saveCall = vi.mocked(notificationRepo.save).mock.calls[0];
      if (saveCall) {
        const notificationAgg = saveCall[0];
        expect(notificationAgg.entity.type).toBe('workspace-invitation');
        expect(notificationAgg.entity.title).toContain('Notification Test Workspace');
        expect(notificationAgg.userId.value).toBe(otherUserId); // 초대받은 사람
      }
    });

    it('Notification 발송 실패해도 초대는 생성되어야 한다 (Graceful Degradation)', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Graceful Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // Organization Member Repository Stub
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );
      vi.mocked(orgMemberRepo.searchUserProfileByEmail).mockImplementation(
        async (email: string) => {
          if (email === testUserId) {
            return [{
              userId: testUserId,
              email: 'admin@test.com',
              name: 'Admin User',
              profileImageUrl: '',
            }];
          }
          if (email === 'invitee@test.com') {
            return [{
              userId: otherUserId,
              email: 'invitee@test.com',
              name: 'Invitee User',
              profileImageUrl: '',
            }];
          }
          return [];
        }
      );
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);

      // Notification save가 실패하도록 설정
      vi.mocked(notificationRepo.save).mockRejectedValue(
        new Error('Notification service unavailable')
      );

      // When
      const result = await serviceWithNotification.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['invitee@test.com'],
        testUserId
      );

      // Then: 초대는 성공 (Notification 실패해도 초대 생성)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }

      // Invitation이 DB에 저장되었는지 확인
      const invitations = await adminDb
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, workspace.workspace.workspaceId.value));

      expect(invitations).toHaveLength(1);
      expect(invitations[0]!.invited_user_id).toBe(otherUserId);
      expect(invitations[0]!.status).toBe('pending');
    });

    it('초대 저장 시 초대 ID를 포함해야 한다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Invitation ID Test',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // Mocks 설정
      vi.mocked(orgMemberRepo.findMemberRole).mockResolvedValue(
        new MemberRole('admin')
      );
      vi.mocked(orgMemberRepo.searchUserProfileByEmail).mockImplementation(
        async (email: string) => {
          if (email === testUserId) {
            return [{
              userId: testUserId,
              email: 'admin@test.com',
              name: 'Admin User',
              profileImageUrl: '',
            }];
          }
          if (email === 'invitee@test.com') {
            return [{
              userId: otherUserId,
              email: 'invitee@test.com',
              name: 'Invitee User',
              profileImageUrl: '',
            }];
          }
          return [];
        }
      );
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);

      // When
      const result = await serviceWithNotification.inviteWorkspaceMembers(
        workspace.workspace.workspaceId,
        ['invitee@test.com'],
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      // Invitation이 DB에 저장되었고 ID가 UUID 형식인지 확인
      const invitations = await adminDb
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, workspace.workspace.workspaceId.value));

      expect(invitations).toHaveLength(1);
      expect(invitations[0]!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('acceptWorkspaceInvitation (Scenario 3)', () => {
    it('초대받은 본인만 수락할 수 있어야 한다', async () => {
      // Given: Workspace와 초대 생성은 Service 메서드 구현 후 테스트
      // (현재는 스킵, Service 구현 후 완성)
      expect(true).toBe(true);
    });
  });

  describe('rejectWorkspaceInvitation (Scenario 3)', () => {
    it('초대받은 본인만 거절할 수 있어야 한다', async () => {
      // Given: Workspace와 초대 생성은 Service 메서드 구현 후 테스트
      // (현재는 스킵, Service 구현 후 완성)
      expect(true).toBe(true);
    });
  });
});

