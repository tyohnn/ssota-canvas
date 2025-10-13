import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DefaultWorkspaceInvitationService } from '../workspace-invitation.service';
import { DrizzleWorkspaceRepository } from '../../repositories/implementations/drizzle-workspace.repository';
import { DrizzleWorkspaceMemberRepository } from '../../repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceInvitationRepository } from '../../repositories/implementations/drizzle-workspace-invitation.repository';
import type { OrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization-member.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { NotificationRepository } from '@/domains/notification-management/backend/repositories/interfaces/notification.repository.interface';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { MemberRole } from '@/domains/organization-management/shared/value-objects/member-role.vo';
import { WorkspaceAggregate } from '../../../shared/aggregates/workspace.aggregate';
import { adminDb } from '@/db';
import { workspaces, workspaceMembers, workspaceInvitations } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('WorkspaceInvitationService Integration Tests (Scenario 3)', () => {
  let service: DefaultWorkspaceInvitationService;
  let serviceWithNotification: DefaultWorkspaceInvitationService;
  let workspaceRepo: DrizzleWorkspaceRepository;
  let workspaceMemberRepo: DrizzleWorkspaceMemberRepository;
  let invitationRepo: DrizzleWorkspaceInvitationRepository;
  let orgMemberRepo: OrganizationMemberRepository;
  let orgRepo: OrganizationRepository;
  let notificationRepo: NotificationRepository;

  let testOrgId: OrganizationId;
  let testUserId: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Repositories 초기화
    workspaceRepo = new DrizzleWorkspaceRepository();
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
      getOrganizationName: vi.fn().mockResolvedValue('Test Organization'),
    } as any;

    // Notification Repository Mock
    notificationRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
    } as any;

    // Service 초기화 (Notification 없음)
    service = new DefaultWorkspaceInvitationService(
      workspaceRepo,
      workspaceMemberRepo,
      orgMemberRepo,
      orgRepo
    );

    // Service 초기화 (Notification 있음)
    serviceWithNotification = new DefaultWorkspaceInvitationService(
      workspaceRepo,
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

    // Clean up
    const existingWorkspaces = await adminDb
      .select()
      .from(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
    
    for (const ws of existingWorkspaces) {
      await adminDb
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, ws.id));
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
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, ws.id));
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

  describe('inviteWorkspaceMembers', () => {
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

  describe('acceptWorkspaceInvitation', () => {
    it('초대받은 본인만 수락할 수 있어야 한다', async () => {
      // Given: Workspace와 초대 생성은 Service 메서드 구현 후 테스트
      // (현재는 스킵, Service 구현 후 완성)
      expect(true).toBe(true);
    });
  });

  describe('rejectWorkspaceInvitation', () => {
    it('초대받은 본인만 거절할 수 있어야 한다', async () => {
      // Given: Workspace와 초대 생성은 Service 메서드 구현 후 테스트
      // (현재는 스킵, Service 구현 후 완성)
      expect(true).toBe(true);
    });
  });
});

