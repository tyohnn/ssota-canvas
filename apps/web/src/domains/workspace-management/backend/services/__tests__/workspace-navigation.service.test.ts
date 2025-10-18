import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultWorkspaceNavigationService } from '../workspace-navigation.service';
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

describe('WorkspaceNavigationService Integration Tests (Scenario 1)', () => {
  let service: DefaultWorkspaceNavigationService;
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
      searchUserProfileByEmail: vi.fn(),
    } as any;

    // Service 초기화
    service = new DefaultWorkspaceNavigationService(
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

    it('다른 사용자의 개인 워크스페이스는 보이지 않아야 한다', async () => {
      // Given: 조직 멤버 + 다른 사용자의 개인 워크스페이스 생성
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);
      
      const otherUserId = '8c3e5a9b-7d42-4f1a-9b3e-2c8d7a6f5e4b';
      const personalWorkspace = WorkspaceAggregate.createPersonal(
        testOrgId.value,
        otherUserId,
        'Other User'
      );
      await workspaceRepo.save(personalWorkspace);

      // When: 현재 사용자가 조회
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId
      );

      // Then: 다른 사용자의 개인 워크스페이스는 보이지 않아야 함
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaces).toHaveLength(1); // Default Workspace만
        expect(result.data.workspaces[0]?.isDefault).toBe(true);
        
        // 개인 워크스페이스는 포함되지 않음
        const hasPersonalWorkspace = result.data.workspaces.some(
          ws => ws.isPersonal
        );
        expect(hasPersonalWorkspace).toBe(false);
      }
    });

    it('자신의 개인 워크스페이스는 보여야 한다', async () => {
      // Given: 조직 멤버 + 자신의 개인 워크스페이스 생성
      vi.mocked(orgMemberRepo.isMember).mockResolvedValue(true);
      
      const personalWorkspace = WorkspaceAggregate.createPersonal(
        testOrgId.value,
        testUserId,
        'Test User'
      );
      await workspaceRepo.save(personalWorkspace);

      // When: 현재 사용자가 조회
      const result = await service.getOrganizationWorkspacePageView(
        testOrgId,
        testUserId
      );

      // Then: 자신의 개인 워크스페이스가 보여야 함
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaces).toHaveLength(2); // Default + Personal
        
        const personalWs = result.data.workspaces.find(ws => ws.isPersonal);
        expect(personalWs).toBeDefined();
        expect(personalWs?.ownerId).toBe(testUserId);
        expect(personalWs?.name).toContain('Test User');
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
});

