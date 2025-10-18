import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzlePageRepository } from '../drizzle-page.repository';
import { PageAggregate } from '../../../../shared/aggregates/page.aggregate';
import { WorkspaceAggregate } from '../../../../shared/aggregates/workspace.aggregate';
import { DrizzleWorkspaceRepository } from '../drizzle-workspace.repository';
import { OrganizationId, UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../../../shared/value-objects/page-id.vo';
import { adminDb } from '@/db';
import { pages, workspaces } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('PageRepository Integration Tests', () => {
  let pageRepository: DrizzlePageRepository;
  let workspaceRepository: DrizzleWorkspaceRepository;
  let testOrgId: OrganizationId;
  let testUserId: UserId;
  let testWorkspaceId: WorkspaceId;

  beforeEach(async () => {
    pageRepository = new DrizzlePageRepository();
    workspaceRepository = new DrizzleWorkspaceRepository();

    // 실제 DB에 존재하는 user와 organization 사용
    testUserId = new UserId('4b709f4d-5531-4600-ba2b-97b1e087b449');
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up existing data (해당 조직의 데이터만)
    // Step 1: 먼저 workspaces 조회
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));

    // Step 2: 해당 workspaces의 pages 삭제
    if (existingWorkspaces.length > 0) {
      for (const ws of existingWorkspaces) {
        await adminDb.delete(pages).where(eq(pages.workspace_id, ws.id));
      }
    }

    // Step 3: workspaces 삭제
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));

    // Setup: Create test workspace
    const workspaceAggregate = WorkspaceAggregate.createDefault({
      organizationId: testOrgId.value,
      createdBy: testUserId.value,
    });
    await workspaceRepository.save(workspaceAggregate);
    testWorkspaceId = workspaceAggregate.workspace.workspaceId;
  });

  afterEach(async () => {
    // Clean up after each test (해당 조직의 데이터만)
    // Step 1: 해당 workspace의 pages 삭제
    await adminDb.delete(pages).where(eq(pages.workspace_id, testWorkspaceId.value));

    // Step 2: workspaces 삭제
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('save', () => {
    it('Page를 데이터베이스에 저장해야 한다', async () => {
      // Given
      const aggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Welcome Page',
          icon: '📄',
          createdBy: testUserId.value,
        },
        null
      );

      // When
      await pageRepository.save(aggregate);

      // Then
      const saved = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, aggregate.page.pageId.value));

      expect(saved).toHaveLength(1);
      expect(saved[0]?.title).toBe('Welcome Page');
      expect(saved[0]?.depth).toBe(0);
      expect(saved[0]?.parent_id).toBeNull();
    });

    it('depth가 저장되어야 한다', async () => {
      // Given
      const aggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root Page',
          createdBy: testUserId.value,
        },
        null
      );

      // When
      await pageRepository.save(aggregate);

      // Then
      const saved = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, aggregate.page.pageId.value));

      expect(saved[0]?.depth).toBe(0);
    });

    it('parentId가 null이면 depth=0이어야 한다', async () => {
      // Given
      const aggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );

      // When
      await pageRepository.save(aggregate);

      // Then
      const saved = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, aggregate.page.pageId.value));

      expect(saved[0]?.parent_id).toBeNull();
      expect(saved[0]?.depth).toBe(0);
    });

    it('parentId가 있으면 depth=부모depth+1이어야 한다', async () => {
      // Given: 부모 페이지 생성
      const parentAggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Parent',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(parentAggregate);

      // When: 자식 페이지 생성
      const parentPage = await pageRepository.findById(
        parentAggregate.page.pageId
      );
      const childAggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: parentAggregate.page.pageId.value,
          title: 'Child',
          createdBy: testUserId.value,
        },
        parentPage
      );
      await pageRepository.save(childAggregate);

      // Then
      const saved = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, childAggregate.page.pageId.value));

      expect(saved[0]?.depth).toBe(1); // parent depth (0) + 1
      expect(saved[0]?.parent_id).toBe(parentAggregate.page.pageId.value);
    });
  });

  describe('findById', () => {
    it('ID로 Page를 찾아야 한다', async () => {
      // Given
      const aggregate = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Find Test',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(aggregate);

      // When
      const found = await pageRepository.findById(aggregate.page.pageId);

      // Then
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Find Test');
      expect(found?.pageId.equals(aggregate.page.pageId)).toBe(true);
    });

    it('존재하지 않는 ID는 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = new PageId('999e8400-e29b-41d4-a716-446655440000');

      // When
      const found = await pageRepository.findById(nonExistentId);

      // Then
      expect(found).toBeNull();
    });
  });

  describe('findTreeByWorkspaceId (재귀 CTE 핵심!)', () => {
    it('Workspace의 모든 페이지를 트리 구조로 조회해야 한다', async () => {
      // Given: 3단계 계층 구조 생성
      // Root
      const root = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(root);

      // Level 1
      const rootPage = await pageRepository.findById(root.page.pageId);
      const child1 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: root.page.pageId.value,
          title: 'Child 1',
          createdBy: testUserId.value,
        },
        rootPage
      );
      await pageRepository.save(child1);

      // Level 2
      const child1Page = await pageRepository.findById(child1.page.pageId);
      const grandchild = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: child1.page.pageId.value,
          title: 'Grandchild',
          createdBy: testUserId.value,
        },
        child1Page
      );
      await pageRepository.save(grandchild);

      // When: 재귀 CTE로 트리 조회
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree).toHaveLength(3);
      expect(tree.map((p: any) => p.title)).toEqual(['Root', 'Child 1', 'Grandchild']);
    });

    it('depth 순서로 정렬되어야 한다 (0 → 1 → 2 → ...)', async () => {
      // Given
      const root = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(root);

      const rootPage = await pageRepository.findById(root.page.pageId);
      const child = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: root.page.pageId.value,
          title: 'Child',
          createdBy: testUserId.value,
        },
        rootPage
      );
      await pageRepository.save(child);

      // When
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree[0]?.depth).toBe(0);
      expect(tree[1]?.depth).toBe(1);
    });

    it('같은 레벨 내에서는 order로 정렬되어야 한다', async () => {
      // Given: 같은 레벨에 3개 페이지 생성 (order: 0, 1, 2)
      const page1 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Page 1',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(page1);

      const page2 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Page 2',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(page2);

      const page3 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Page 3',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(page3);

      // When
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree).toHaveLength(3);
      // order 순서로 정렬되어야 함
      expect(tree.map((p: any) => p.title)).toEqual(['Page 1', 'Page 2', 'Page 3']);
    });

    it('삭제된 페이지는 제외해야 한다', async () => {
      // Given
      const page1 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Active',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(page1);

      const page2 = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Deleted',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(page2);

      // Soft delete page2
      await adminDb
        .update(pages)
        .set({ deleted_at: new Date() })
        .where(eq(pages.id, page2.page.pageId.value));

      // When
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree).toHaveLength(1);
      expect(tree[0]?.title).toBe('Active');
    });

    it('빈 Workspace는 빈 배열을 반환해야 한다', async () => {
      // Given: 빈 workspace (페이지 없음)

      // When
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree).toHaveLength(0);
    });

    it('5단계 이상 깊이도 올바르게 조회해야 한다', async () => {
      // Given: 5단계 계층 생성
      let currentParent: any = null;
      let currentParentId: string | undefined = undefined;

      for (let i = 0; i < 5; i++) {
        const aggregate = PageAggregate.create(
          {
            workspaceId: testWorkspaceId.value,
            parentId: currentParentId,
            title: `Level ${i}`,
            createdBy: testUserId.value,
          },
          currentParent
        );
        await pageRepository.save(aggregate);
        currentParent = await pageRepository.findById(aggregate.page.pageId);
        currentParentId = aggregate.page.pageId.value;
      }

      // When
      const tree = await pageRepository.findTreeByWorkspaceId(testWorkspaceId);

      // Then
      expect(tree).toHaveLength(5);
      expect(tree.map((p: any) => p.depth)).toEqual([0, 1, 2, 3, 4]);
      expect(tree.map((p: any) => p.title)).toEqual([
        'Level 0',
        'Level 1',
        'Level 2',
        'Level 3',
        'Level 4',
      ]);
    });
  });

  describe('findAncestors (순환 참조 체크용)', () => {
    it('재귀 CTE로 모든 조상 페이지를 조회해야 한다', async () => {
      // Given: 3단계 계층
      const root = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(root);

      const rootPage = await pageRepository.findById(root.page.pageId);
      const child = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: root.page.pageId.value,
          title: 'Child',
          createdBy: testUserId.value,
        },
        rootPage
      );
      await pageRepository.save(child);

      const childPage = await pageRepository.findById(child.page.pageId);
      const grandchild = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: child.page.pageId.value,
          title: 'Grandchild',
          createdBy: testUserId.value,
        },
        childPage
      );
      await pageRepository.save(grandchild);

      // When: Grandchild의 조상 조회
      const ancestors = await pageRepository.findAncestors(grandchild.page.pageId);

      // Then
      expect(ancestors).toHaveLength(3); // Grandchild, Child, Root
      expect(ancestors.map((p: any) => p.title)).toEqual([
        'Grandchild',
        'Child',
        'Root',
      ]);
    });

    it('순환 참조 감지가 가능해야 한다', async () => {
      // Given: Root 페이지
      const root = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(root);

      // When: Root의 조상 조회
      const ancestors = await pageRepository.findAncestors(root.page.pageId);

      // Then: Root만 반환 (조상 없음)
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0]?.title).toBe('Root');
    });
  });

  describe('updateDepth', () => {
    it('Page의 depth를 업데이트해야 한다', async () => {
      // Given: 부모가 있는 페이지 생성 (depth=1)
      const parent = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Parent',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(parent);

      const parentPage = await pageRepository.findById(parent.page.pageId);
      const child = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: parent.page.pageId.value,
          title: 'Child',
          createdBy: testUserId.value,
        },
        parentPage
      );
      await pageRepository.save(child);

      // When: depth를 2로 변경 (parent_id가 있으므로 가능)
      await pageRepository.updateDepth(child.page.pageId, 2);

      // Then
      const updated = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, child.page.pageId.value));

      expect(updated[0]?.depth).toBe(2);
    });
  });

  describe('updateChildrenDepth (재귀 업데이트)', () => {
    it('하위 페이지들의 depth도 재귀적으로 업데이트해야 한다', async () => {
      // Given: 3단계 계층
      const root = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          title: 'Root',
          createdBy: testUserId.value,
        },
        null
      );
      await pageRepository.save(root);

      const rootPage = await pageRepository.findById(root.page.pageId);
      const child = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: root.page.pageId.value,
          title: 'Child',
          createdBy: testUserId.value,
        },
        rootPage
      );
      await pageRepository.save(child);

      const childPage = await pageRepository.findById(child.page.pageId);
      const grandchild = PageAggregate.create(
        {
          workspaceId: testWorkspaceId.value,
          parentId: child.page.pageId.value,
          title: 'Grandchild',
          createdBy: testUserId.value,
        },
        childPage
      );
      await pageRepository.save(grandchild);

      // When: Root 이동 (depth 0 → 1로, delta = +1)
      await pageRepository.updateChildrenDepth(root.page.pageId, 1);

      // Then: 모든 하위 페이지의 depth가 +1 되어야 함
      const allPages = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.workspace_id, testWorkspaceId.value));

      const childDepth = allPages.find(p => p.title === 'Child')?.depth;
      const grandchildDepth = allPages.find(p => p.title === 'Grandchild')?.depth;

      expect(childDepth).toBe(2); // 1 + 1
      expect(grandchildDepth).toBe(3); // 2 + 1
    });
  });
});

