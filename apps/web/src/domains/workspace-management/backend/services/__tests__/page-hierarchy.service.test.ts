import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DefaultPageHierarchyService } from '../page-hierarchy.service';
import { DrizzlePageRepository } from '../../repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '../../repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '../../repositories/implementations/drizzle-workspace.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('PageHierarchyService Integration Tests (Scenario 4)', () => {
  let service: DefaultPageHierarchyService;
  let pageRepo: DrizzlePageRepository;
  let workspaceMemberRepo: DrizzleWorkspaceMemberRepository;
  let workspaceRepo: DrizzleWorkspaceRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Repositories 초기화
    pageRepo = new DrizzlePageRepository();
    workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    workspaceRepo = new DrizzleWorkspaceRepository();

    // Service 초기화
    service = new DefaultPageHierarchyService(
      pageRepo,
      workspaceMemberRepo
    );

    // Test data
    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    otherUserId = 'cd04e75e-9ee8-4261-9de3-9f494d1689eb';
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
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    
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
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('createPage', () => {
    it('Workspace 멤버가 Page를 생성할 수 있어야 한다', async () => {
      // Given: Workspace와 멤버십 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Page Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      // When
      const result = await service.createPage(
        workspace.workspace.workspaceId,
        null, // 최상위 페이지
        'New Page',
        '📄',
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        
        // DB에 저장되었는지 확인
        const savedPage = await adminDb
          .select()
          .from(pages)
          .where(eq(pages.id, result.data));
        
        expect(savedPage).toHaveLength(1);
        expect(savedPage[0]?.title).toBe('New Page');
        expect(savedPage[0]?.depth).toBe(0);
      }
    });

    it('하위 페이지를 생성할 수 있어야 한다', async () => {
      // Given: Workspace와 부모 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Page Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const parentPage = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Parent Page',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(parentPage);

      // When
      const result = await service.createPage(
        workspace.workspace.workspaceId,
        parentPage.page.pageId,
        'Child Page',
        '📄',
        testUserId
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        const savedPage = await adminDb
          .select()
          .from(pages)
          .where(eq(pages.id, result.data));
        
        expect(savedPage[0]?.depth).toBe(1); // 부모 depth (0) + 1
        expect(savedPage[0]?.parent_id).toBe(parentPage.page.pageId.value);
      }
    });

    it('Workspace 멤버가 아니면 Page를 생성할 수 없어야 한다', async () => {
      // Given: Workspace 생성 (otherUser는 멤버 아님)
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Page Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      // When
      const result = await service.createPage(
        workspace.workspace.workspaceId,
        null,
        'New Page',
        '📄',
        otherUserId // 멤버 아님
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }
    });

    it('존재하지 않는 부모 페이지로 생성하면 실패해야 한다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Page Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const nonExistentParentId = new PageId('99009999-e29b-4999-a999-999999999999');

      // When
      const result = await service.createPage(
        workspace.workspace.workspaceId,
        nonExistentParentId,
        'Orphan Page',
        '📄',
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('PAGE_NOT_FOUND');
      }
    });
  });

  describe('movePage', () => {
    it('Page를 다른 부모로 이동할 수 있어야 한다', async () => {
      // Given: Workspace와 2개의 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Move Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const pageA = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page A',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(pageA);

      const pageB = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page B',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(pageB);

      // When: Page A를 Page B의 하위로 이동
      const result = await service.movePage(
        pageA.page.pageId,
        pageB.page.pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      // DB에서 확인
      const movedPage = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, pageA.page.pageId.value));
      
      expect(movedPage[0]?.parent_id).toBe(pageB.page.pageId.value);
      expect(movedPage[0]?.depth).toBe(1); // B는 depth=0, A는 1
    });

    it('순환 참조가 감지되면 이동할 수 없어야 한다', async () => {
      // Given: Page A > Page B 계층 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Circular Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const pageA = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page A',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(pageA);

      const pageB = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          parentId: pageA.page.pageId.value,
          title: 'Page B',
          createdBy: testUserId,
        },
        pageA.page
      );
      await pageRepo.save(pageB);

      // When: Page A를 Page B의 하위로 이동 시도 (순환 참조!)
      const result = await service.movePage(
        pageA.page.pageId,
        pageB.page.pageId,
        testUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('CIRCULAR_REFERENCE_DETECTED');
      }
    });

    it('Workspace 멤버가 아니면 Page를 이동할 수 없어야 한다', async () => {
      // Given: Workspace와 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Move Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      const page = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(page);

      // When: otherUser가 이동 시도 (멤버 아님)
      const result = await service.movePage(
        page.page.pageId,
        null,
        otherUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }
    });
  });

  describe('updatePageInfo', () => {
    it('Page 제목을 업데이트할 수 있어야 한다', async () => {
      // Given: Workspace와 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Update Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const page = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Old Title',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(page);

      // When
      const result = await service.updatePageInfo(
        page.page.pageId,
        'New Title',
        undefined,
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      // DB에서 확인
      const updatedPage = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, page.page.pageId.value));
      
      expect(updatedPage[0]?.title).toBe('New Title');
    });

    it('Page 아이콘을 업데이트할 수 있어야 한다', async () => {
      // Given
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Update Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await workspaceMemberRepo.addMember(workspace.workspace.workspaceId, testUserId);

      const page = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page',
          icon: '📄',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(page);

      // When
      const result = await service.updatePageInfo(
        page.page.pageId,
        undefined,
        '🚀',
        testUserId
      );

      // Then
      expect(result.success).toBe(true);

      const updatedPage = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, page.page.pageId.value));
      
      expect(updatedPage[0]?.icon).toBe('🚀');
    });

    it('Workspace 멤버가 아니면 Page 정보를 수정할 수 없어야 한다', async () => {
      // Given
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Update Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      const page = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Page',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(page);

      // When: otherUser가 수정 시도 (멤버 아님)
      const result = await service.updatePageInfo(
        page.page.pageId,
        'Hacked Title',
        undefined,
        otherUserId
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }
    });
  });
});

