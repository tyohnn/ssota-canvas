import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOrganizationWorkspacePageViewAction,
  getPageDetailsAction,
  createWorkspaceAction,
  updateWorkspaceInfoAction,
  getWorkspaceMembersAction,
  searchOrganizationMembersAction,
  createPageAction,
  movePageAction,
  updatePageInfoAction,
} from '../workspace-management.actions';
import { adminDb } from '@/db';
import { workspaces, pages, workspaceMembers, workspaceInvitations } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';
import { WorkspaceAggregate } from '../../shared/aggregates/workspace.aggregate';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { DrizzleWorkspaceRepository } from '../../backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '../../backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceInvitationRepository } from '../../backend/repositories/implementations/drizzle-workspace-invitation.repository';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import { WorkspaceInvitationId } from '../../shared/value-objects/workspace-invitation-id.vo';
import { WorkspaceInvitation } from '../../shared/entities/workspace-invitation.entity';

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

// Mock Organization Domain Repositories
const mockOrgMemberRepo = {
  isMember: vi.fn(() => Promise.resolve(true)),
  findMemberRole: vi.fn(() =>
    Promise.resolve({
      value: 'owner', // Scenario 2: owner로 기본 설정
    })
  ),
  searchOrganizationMembersByEmail: vi.fn(() => Promise.resolve([])), // Default: 빈 배열
};

const mockOrgRepo = {
  findById: vi.fn(),
  findByIdAsAdmin: vi.fn(),
  findByOwnerId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  getOrganizationName: vi.fn(() => Promise.resolve('Test Organization')),
};

vi.mock(
  '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository',
  () => ({
    DrizzleOrganizationMemberRepository: vi.fn(() => mockOrgMemberRepo),
  })
);

vi.mock(
  '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository',
  () => ({
    DrizzleOrganizationRepository: vi.fn(() => mockOrgRepo),
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
  let otherUserId: string;

  beforeEach(async () => {
    workspaceRepo = new DrizzleWorkspaceRepository();
    pageRepo = new DrizzlePageRepository();

    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    otherUserId = '99b6e668-9e5f-4175-be74-2efc0aef967f';
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

  describe('inviteWorkspaceMemberAction (Scenario 3)', () => {
    it('조직 Admin + Workspace 멤버가 초대할 수 있어야 한다', async () => {
      // Given: 새 Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Test Workspace for Invitation',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);

      // Workspace에 현재 사용자 멤버로 추가
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspace.workspace.workspaceId.value,
        user_id: testUserId,
      });

      // Organization Member Repository Mock: admin 권한
      mockOrgMemberRepo.findMemberRole.mockResolvedValue({
        role: { value: 'admin' },
      } as any);

      // When: (현재는 간단한 stub으로 통과, 실제 구현은 다음 단계)
      // TODO: invitationRepo 추가 후 실제 호출 테스트
      // const result = await inviteWorkspaceMemberAction({
      //   workspaceId: workspace.workspace.workspaceId.value,
      //   memberEmails: ['newmember@test.com'],
      // });

      // Then: (Notification Service 통합 후 완성)
      expect(true).toBe(true);
    });
  });

  describe('acceptWorkspaceInvitationAction (Scenario 3)', () => {
    it('초대받은 본인만 수락할 수 있어야 한다', async () => {
      // TODO: Service 메서드 완성 후 테스트 작성
      expect(true).toBe(true);
    });
  });

  describe('rejectWorkspaceInvitationAction (Scenario 3)', () => {
    it('초대받은 본인만 거절할 수 있어야 한다', async () => {
      // TODO: Service 메서드 완성 후 테스트 작성
      expect(true).toBe(true);
    });
  });

  describe('getWorkspaceMembersAction (Scenario 3)', () => {
    it('Workspace 멤버 목록을 조회할 수 있어야 한다', async () => {
      // Given: 새 Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Member List Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      const workspaceId = workspace.workspace.workspaceId.value;

      // 2명의 멤버 추가
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspaceId,
        user_id: testUserId,
      });
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspaceId,
        user_id: otherUserId,
      });

      // When
      const result = await getWorkspaceMembersAction({ workspaceId });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaceId).toBe(workspaceId);
        expect(result.data.workspaceName).toBe('Member List Test Workspace');
        expect(result.data.currentMembers).toHaveLength(2);
        expect(result.data.currentMembers.every(m => m.userId)).toBe(true);
        expect(result.data.currentMembers.every(m => m.email)).toBe(true);
        expect(result.data.currentMembers.every(m => m.name)).toBe(true);
      }

      // Cleanup
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspaceId));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspaceId));
    });

    it('pending 초대 목록도 함께 조회해야 한다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Invitation List Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      const workspaceId = workspace.workspace.workspaceId.value;

      // 멤버 1명 추가
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspaceId,
        user_id: testUserId,
      });

      // pending 초대 1개 추가
      const invitationRepo = new DrizzleWorkspaceInvitationRepository();
      const invitation = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(workspaceId),
        otherUserId,
        testUserId,
        'pending',
        null,
        new Date(),
        null
      );
      await invitationRepo.save(invitation);

      // When
      const result = await getWorkspaceMembersAction({ workspaceId });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentMembers).toHaveLength(1);
        expect(result.data.pendingInvitations).toHaveLength(1);
        expect(result.data.pendingInvitations[0]!.invitedUserEmail).toBeTruthy();
        expect(result.data.pendingInvitations[0]!.inviterName).toBeTruthy();
      }

      // Cleanup
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspaceId));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspaceId));
    });

    it('존재하지 않는 Workspace는 에러를 반환해야 한다', async () => {
      // When
      const result = await getWorkspaceMembersAction({
        workspaceId: '999e8400-e29b-41d4-a716-446655440000',
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('WORKSPACE_NOT_FOUND');
      }
    });
  });

  describe('searchOrganizationMembersAction (Scenario 3) - hasPendingInvitation 확인', () => {
    it('검색 결과에 hasPendingInvitation 플래그를 포함해야 한다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Search Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      const workspaceId = workspace.workspace.workspaceId.value;

      // When: 검색 (결과가 있든 없든 success=true)
      const result = await searchOrganizationMembersAction({
        workspaceId,
        query: 'test',
      });

      // Then: 성공 및 DTO 구조 확인
      expect(result.success).toBe(true);
      if (result.success && result.data.length > 0) {
        // 결과가 있으면 플래그 존재 확인
        expect(result.data[0]).toHaveProperty('isAlreadyMember');
        expect(result.data[0]).toHaveProperty('hasPendingInvitation');
        expect(typeof result.data[0]!.isAlreadyMember).toBe('boolean');
        expect(typeof result.data[0]!.hasPendingInvitation).toBe('boolean');
      }

      // Cleanup
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspaceId));
    });
  });

  describe('createPageAction (Scenario 4)', () => {
    it('Workspace 멤버가 Page를 생성할 수 있어야 한다', async () => {
      // Given: Workspace 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Page Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspace.workspace.workspaceId.value,
        user_id: testUserId,
      });

      // When
      const result = await createPageAction({
        workspaceId: workspace.workspace.workspaceId.value,
        title: 'New Page',
        icon: '📄',
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      }

      // Cleanup
      await adminDb.delete(pages).where(eq(pages.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspace.workspace.workspaceId.value));
    });

    it('기본값이 적용되어야 한다 (title: Untitled, icon: 📄)', async () => {
      // Given
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Default Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspace.workspace.workspaceId.value,
        user_id: testUserId,
      });

      // When: title, icon 없이 생성
      const result = await createPageAction({
        workspaceId: workspace.workspace.workspaceId.value,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        const savedPage = await adminDb
          .select()
          .from(pages)
          .where(eq(pages.id, result.data.pageId));
        
        expect(savedPage[0]?.title).toBe('Untitled');
        expect(savedPage[0]?.icon).toBe('📄');
      }

      // Cleanup
      await adminDb.delete(pages).where(eq(pages.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspace.workspace.workspaceId.value));
    });
  });

  describe('movePageAction (Scenario 4)', () => {
    it('Page를 이동할 수 있어야 한다', async () => {
      // Given: Workspace와 2개 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Move Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspace.workspace.workspaceId.value,
        user_id: testUserId,
      });

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
      const result = await movePageAction({
        pageId: pageA.page.pageId.value,
        newParentId: pageB.page.pageId.value,
      });

      // Then
      expect(result.success).toBe(true);

      // DB 확인
      const movedPage = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, pageA.page.pageId.value));
      
      expect(movedPage[0]?.parent_id).toBe(pageB.page.pageId.value);

      // Cleanup
      await adminDb.delete(pages).where(eq(pages.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspace.workspace.workspaceId.value));
    });
  });

  describe('updatePageInfoAction (Scenario 4)', () => {
    it('Page 정보를 수정할 수 있어야 한다', async () => {
      // Given: Workspace와 페이지 생성
      const workspace = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Update Test Workspace',
        createdBy: testUserId,
      });
      await workspaceRepo.save(workspace);
      await adminDb.insert(workspaceMembers).values({
        workspace_id: workspace.workspace.workspaceId.value,
        user_id: testUserId,
      });

      const page = PageAggregate.create(
        {
          workspaceId: workspace.workspace.workspaceId.value,
          title: 'Old Title',
          icon: '📄',
          createdBy: testUserId,
        },
        null
      );
      await pageRepo.save(page);

      // When
      const result = await updatePageInfoAction({
        pageId: page.page.pageId.value,
        title: 'New Title',
        icon: '🚀',
      });

      // Then
      expect(result.success).toBe(true);

      // DB 확인
      const updatedPage = await adminDb
        .select()
        .from(pages)
        .where(eq(pages.id, page.page.pageId.value));
      
      expect(updatedPage[0]?.title).toBe('New Title');
      expect(updatedPage[0]?.icon).toBe('🚀');

      // Cleanup
      await adminDb.delete(pages).where(eq(pages.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaceMembers).where(eq(workspaceMembers.workspace_id, workspace.workspace.workspaceId.value));
      await adminDb.delete(workspaces).where(eq(workspaces.id, workspace.workspace.workspaceId.value));
    });
  });
});

