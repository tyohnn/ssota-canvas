import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrganizationWorkspacePageViewAction,
  getPageDetailsAction,
  createWorkspaceAction,
  updateWorkspaceInfoAction,
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
const mockOrgMemberRepo = {
  isMember: vi.fn(() => Promise.resolve(true)),
  findMemberRole: vi.fn(() =>
    Promise.resolve({
      value: 'owner', // Scenario 2: owner로 기본 설정
    })
  ),
};

vi.mock(
  '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository',
  () => ({
    DrizzleOrganizationMemberRepository: vi.fn(() => mockOrgMemberRepo),
  })
);

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

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

  // Scenario 2: Workspace 생성 및 정보 수정
  describe('createWorkspaceAction (Scenario 2)', () => {
    beforeEach(() => {
      // 조직 owner로 설정
      mockOrgMemberRepo.findMemberRole.mockResolvedValue({
        value: 'owner',
      });
    });

    it('조직 소유자가 Workspace를 생성할 수 있어야 한다', async () => {
      // When
      const result = await createWorkspaceAction({
        organizationId: testOrgId.value,
        name: '마케팅 팀',
        description: '마케팅 캠페인 및 콘텐츠 관리',
        icon: '🎨',
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaceId).toBeDefined();
        expect(result.data.firstPageId).toBeDefined();

        // DB 확인: Workspace 생성됨
        const savedWorkspaces = await adminDb
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, result.data.workspaceId));
        expect(savedWorkspaces).toHaveLength(1);
        expect(savedWorkspaces[0]?.name).toBe('마케팅 팀');
        expect(savedWorkspaces[0]?.description).toBe('마케팅 캠페인 및 콘텐츠 관리');
        expect(savedWorkspaces[0]?.icon).toBe('🎨');

        // DB 확인: 초기 페이지 생성됨
        const savedPages = await adminDb
          .select()
          .from(pages)
          .where(eq(pages.id, result.data.firstPageId));
        expect(savedPages).toHaveLength(1);
        expect(savedPages[0]?.title).toBe('Untitled');
      }
    });

    it('빈 이름으로 생성하면 에러를 반환해야 한다', async () => {
      // When
      const result = await createWorkspaceAction({
        organizationId: testOrgId.value,
        name: '', // 빈 이름
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INVALID_WORKSPACE_NAME');
      }
    });

    it('조직 Admin은 Workspace를 생성할 수 없어야 한다', async () => {
      // Given: admin role
      mockOrgMemberRepo.findMemberRole.mockResolvedValueOnce({
        value: 'admin',
      });

      // When
      const result = await createWorkspaceAction({
        organizationId: testOrgId.value,
        name: 'Admin Workspace',
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_ORG_OWNER');
      }
    });

    it('인증되지 않은 사용자는 에러를 반환해야 한다', async () => {
      // Given: 인증 실패
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null } as any,
        error: { message: 'Not authenticated' } as any,
      });

      // When
      const result = await createWorkspaceAction({
        organizationId: testOrgId.value,
        name: 'Test Workspace',
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('UNAUTHORIZED');
      }

      // Mock 복원
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: '4b709f4d-5531-4600-ba2b-97b1e087b449',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });
  });

  describe('updateWorkspaceInfoAction (Scenario 2)', () => {
    let createdWorkspaceId: string;

    beforeEach(async () => {
      // Given: Workspace 생성 및 멤버 추가
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Original Name',
        description: 'Original Description',
        icon: '🏠',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      createdWorkspaceId = workspace.workspace.workspaceId.value;

      // 멤버십 추가
      await adminDb.insert(workspaceMembers).values({
        workspace_id: createdWorkspaceId,
        user_id: testUserId,
        joined_at: new Date(),
      });
    });

    it('Workspace 멤버가 정보를 수정할 수 있어야 한다', async () => {
      // When
      const result = await updateWorkspaceInfoAction({
        workspaceId: createdWorkspaceId,
        name: 'Updated Name',
        description: 'Updated Description',
        icon: '🚀',
      });

      // Then
      expect(result.success).toBe(true);

      // DB 확인: 정보 업데이트됨
      const updated = await adminDb
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, createdWorkspaceId));
      expect(updated).toHaveLength(1);
      expect(updated[0]?.name).toBe('Updated Name');
      expect(updated[0]?.description).toBe('Updated Description');
      expect(updated[0]?.icon).toBe('🚀');
    });

    it('이름만 수정할 수 있어야 한다', async () => {
      // When
      const result = await updateWorkspaceInfoAction({
        workspaceId: createdWorkspaceId,
        name: 'New Name Only',
        // description, icon undefined (변경 없음)
      });

      // Then
      expect(result.success).toBe(true);

      // DB 확인: 이름만 변경됨
      const updated = await adminDb
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, createdWorkspaceId));
      expect(updated[0]?.name).toBe('New Name Only');
      expect(updated[0]?.description).toBe('Original Description'); // 유지
      expect(updated[0]?.icon).toBe('🏠'); // 유지
    });

    it('Workspace 멤버가 아니면 수정할 수 없어야 한다', async () => {
      // Given: 멤버십 제거
      await adminDb
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.workspace_id, createdWorkspaceId));

      // When
      const result = await updateWorkspaceInfoAction({
        workspaceId: createdWorkspaceId,
        name: 'Hacked Name',
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('NOT_WORKSPACE_MEMBER');
      }

      // DB 확인: 정보 변경 안됨
      const notUpdated = await adminDb
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, createdWorkspaceId));
      expect(notUpdated[0]?.name).toBe('Original Name');
    });

    it('존재하지 않는 Workspace는 에러를 반환해야 한다', async () => {
      // When
      const result = await updateWorkspaceInfoAction({
        workspaceId: '999e8400-e29b-41d4-a716-446655440000',
        name: 'New Name',
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('WORKSPACE_NOT_FOUND');
      }
    });
  });
});

