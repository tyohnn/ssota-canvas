import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrganizationWorkspacePageViewAction,
  getPageDetailsAction,
} from '../workspace-management.actions';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';
import { WorkspaceAggregate } from '../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { DrizzleWorkspaceRepository } from '../../backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../../backend/repositories/implementations/drizzle-page.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';

// Mock Supabase Auth
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: '4b709f4d-5531-4600-ba2b-97b1e087b449',
            email: 'test@example.com',
          },
        },
        error: null,
      })
    ),
    getSession: vi.fn(() =>
      Promise.resolve({
        data: {
          session: {
            access_token: 'mock-token',
            user: {
              id: '4b709f4d-5531-4600-ba2b-97b1e087b449',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      })
    ),
  },
};

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Organization Domain Repository
vi.mock(
  '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository',
  () => ({
    DrizzleOrganizationMemberRepository: vi.fn(() => ({
      isMember: vi.fn(() => Promise.resolve(true)),
      findMemberRole: vi.fn(() =>
        Promise.resolve({
          value: 'member',
        })
      ),
    })),
  })
);

describe('Workspace Management Server Actions Integration Tests', () => {
  let workspaceRepo: DrizzleWorkspaceRepository;
  let pageRepo: DrizzlePageRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;

  beforeEach(async () => {
    workspaceRepo = new DrizzleWorkspaceRepository();
    pageRepo = new DrizzlePageRepository();

    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up
    await adminDb.delete(pages);
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));

    // Setup: Default Workspace + Pages
    const workspaceAggregate = WorkspaceAggregate.createDefault({
      organizationId: testOrgId.value,
      createdBy: testUserId,
    });
    await workspaceRepo.save(workspaceAggregate);

    const page1 = PageAggregate.create(
      {
        workspaceId: workspaceAggregate.workspace.workspaceId.value,
        title: 'Welcome',
        icon: '👋',
        createdBy: testUserId,
      },
      null
    );
    await pageRepo.save(page1);

    const page2 = PageAggregate.create(
      {
        workspaceId: workspaceAggregate.workspace.workspaceId.value,
        title: 'Getting Started',
        createdBy: testUserId,
      },
      null
    );
    await pageRepo.save(page2);
  });

  afterEach(async () => {
    // Clean up
    await adminDb.delete(pages);
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId));
  });

  describe('getOrganizationWorkspacePageViewAction', () => {
    it('조직 멤버가 Workspace-Page 목록을 조회할 수 있어야 한다', async () => {
      // When
      const result = await getOrganizationWorkspacePageViewAction({
        organizationId: testOrgId.value,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizationId).toBe(testOrgId.value);
        expect(result.data.workspaces).toHaveLength(1);
        expect(result.data.workspaces[0]?.isDefault).toBe(true);
        expect(result.data.workspaces[0]?.pageTree).toHaveLength(2);
        expect(result.data.selectedPageId).toBeDefined();
      }
    });

    it('쿠키 페이지가 유효하면 선택되어야 한다', async () => {
      // Given: 유효한 쿠키 페이지 (첫 번째 페이지)
      const workspace = await workspaceRepo.findByOrganizationId(testOrgId);
      const allPages = await pageRepo.findTreeByWorkspaceId(
        workspace[0]!.workspaceId
      );
      const validPageId = allPages[0]!.pageId.value;

      // When
      const result = await getOrganizationWorkspacePageViewAction({
        organizationId: testOrgId.value,
        cookiePageId: validPageId,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedPageId).toBe(validPageId);
      }
    });

    it('쿠키 페이지가 무효하면 Fallback 해야 한다', async () => {
      // Given: 무효한 쿠키 페이지
      const invalidPageId = '999e8400-e29b-41d4-a716-446655440000';

      // When
      const result = await getOrganizationWorkspacePageViewAction({
        organizationId: testOrgId.value,
        cookiePageId: invalidPageId,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedPageId).not.toBe(invalidPageId);
        expect(result.data.selectedPageId).toBe(
          result.data.workspaces[0]?.pageTree[0]?.id
        );
      }
    });
  });

  describe('getPageDetailsAction', () => {
    it('조직 멤버는 Default Workspace의 페이지 상세를 조회할 수 있어야 한다', async () => {
      // Given
      const workspace = await workspaceRepo.findByOrganizationId(testOrgId);
      const allPages = await pageRepo.findTreeByWorkspaceId(
        workspace[0]!.workspaceId
      );
      const pageId = allPages[0]!.pageId.value;

      // When
      const result = await getPageDetailsAction({
        organizationId: testOrgId.value,
        workspaceId: workspace[0]!.workspaceId.value,
        pageId,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageId).toBe(pageId);
        expect(result.data.title).toBe('Welcome');
        expect(result.data.userRole).toBeDefined();
      }
    });

    it('존재하지 않는 페이지는 에러를 반환해야 한다', async () => {
      // Given
      const workspace = await workspaceRepo.findByOrganizationId(testOrgId);
      const nonExistentPageId = '999e8400-e29b-41d4-a716-446655440000';

      // When
      const result = await getPageDetailsAction({
        organizationId: testOrgId.value,
        workspaceId: workspace[0]!.workspaceId.value,
        pageId: nonExistentPageId,
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('PAGE_NOT_FOUND');
      }
    });
  });
});

