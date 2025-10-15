import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { OrganizationRepository } from '../../repositories/interfaces/organization.repository.interface.js';
import { InvitationRepository } from '../../repositories/interfaces/invitation.repository.interface.js';
import { OrganizationMemberRepository } from '../../repositories/interfaces/organization-member.repository.interface.js';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate.js';
import { InvitationAggregate } from '../../../shared/aggregates/invitation.aggregate.js';
import { UserId, OrganizationId, InvitationId } from '../../../shared/value-objects/ids.vo.js';
import { MemberRole } from '../../../shared/value-objects/member-role.vo.js';
import { DefaultOrganizationInvitationService } from '../organization-invitation.service.js';
import type { WorkspaceCrudService } from '@/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface';

describe('DefaultOrganizationInvitationService', () => {
  let service: DefaultOrganizationInvitationService;
  let mockOrgRepository: Mocked<OrganizationRepository>;
  let mockInvitationRepository: Mocked<InvitationRepository>;
  let mockMemberRepository: Mocked<OrganizationMemberRepository>;
  let mockWorkspaceCrudService: Mocked<WorkspaceCrudService>;

  beforeEach(() => {
    mockOrgRepository = {
      save: vi.fn<OrganizationRepository['save']>(),
      findById: vi.fn<OrganizationRepository['findById']>(),
      findByIdAsAdmin: vi.fn<OrganizationRepository['findByIdAsAdmin']>(),
      findByOwnerId: vi.fn<OrganizationRepository['findByOwnerId']>(),
      delete: vi.fn<OrganizationRepository['delete']>(),
      getOrganizationName: vi.fn<OrganizationRepository['getOrganizationName']>(),
    } as Mocked<OrganizationRepository>;

    mockInvitationRepository = {
      save: vi.fn<InvitationRepository['save']>(),
      findById: vi.fn<InvitationRepository['findById']>(),
      findByOrganizationId: vi.fn<InvitationRepository['findByOrganizationId']>(),
      findByInviteeEmail: vi.fn<InvitationRepository['findByInviteeEmail']>(),
      findByInviteeUserId: vi.fn<InvitationRepository['findByInviteeUserId']>(),
      findPendingByOrganizationId: vi.fn<
        InvitationRepository['findPendingByOrganizationId']
      >(),
      delete: vi.fn<InvitationRepository['delete']>(),
    } as Mocked<InvitationRepository>;

    mockMemberRepository = {
      addMember: vi.fn(),
      removeMember: vi.fn(),
      findByOrganizationId: vi.fn(),
      findByUserId: vi.fn(),
      findMemberRole: vi.fn(),
      isMember: vi.fn(),
      updateMemberRole: vi.fn(),
      getOrganizationMemberView: vi.fn(),
      searchUserProfileByEmail: vi.fn(),
    } as Mocked<OrganizationMemberRepository>;

    mockWorkspaceCrudService = {
      createDefaultWorkspace: vi.fn(),
      createWorkspace: vi.fn(),
      createPersonalWorkspace: vi.fn(), // v1.2
      updateWorkspaceInfo: vi.fn(),
    } as Mocked<WorkspaceCrudService>;

    service = new DefaultOrganizationInvitationService(
      mockOrgRepository,
      mockInvitationRepository,
      mockMemberRepository,
      mockWorkspaceCrudService, // v1.2
      undefined // notificationService
    );
  });

  describe('inviteMember', () => {
    it('멤버를 초대해야 한다', async () => {
      // Given
      const orgId = OrganizationId.generate();
      const inviterUserIdString = crypto.randomUUID();
      const inviterUserId = new UserId(inviterUserIdString);
      const mockOrg = OrganizationAggregate.createDefault(
        'Test Org',
        inviterUserId
      );

      mockOrgRepository.findByIdAsAdmin.mockResolvedValueOnce(mockOrg);
      mockInvitationRepository.findByInviteeEmail.mockResolvedValueOnce(null);
      vi.mocked(mockMemberRepository.searchUserProfileByEmail).mockResolvedValueOnce([
        {
          userId: crypto.randomUUID(),
          email: 'test@example.com',
          name: 'Test User',
          profileImageUrl: '',
        },
      ]);

      const command = {
        organizationId: orgId.value,
        inviterUserId: inviterUserIdString,
        inviteeEmail: 'test@example.com',
        role: 'admin' as const,
        inviterName: 'Tester',
      };

      // When
      const result = await service.inviteMember(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockInvitationRepository.save).toHaveBeenCalledTimes(1);
      expect(mockInvitationRepository.save).toHaveBeenCalledWith(
        expect.any(InvitationAggregate)
      );
    });

    it('존재하지 않는 조직은 에러를 반환해야 한다', async () => {
      // Given
      mockOrgRepository.findByIdAsAdmin.mockResolvedValueOnce(null);

      const command = {
        organizationId: OrganizationId.generate().value,
        inviterUserId: crypto.randomUUID(),
        inviteeEmail: 'test@example.com',
        role: 'admin' as const,
        inviterName: 'Tester',
      };

      // When
      const result = await service.inviteMember(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('Organization not found');
    });

    it('이미 진행 중인 초대가 있으면 에러를 반환해야 한다', async () => {
      // Given
      const orgId = OrganizationId.generate();
      const inviterUserIdString = crypto.randomUUID();
      const inviterUserId = new UserId(inviterUserIdString);
      const mockOrg = OrganizationAggregate.createDefault(
        'Test Org',
        inviterUserId
      );

      const existingInvitation = InvitationAggregate.create(
        orgId,
        inviterUserId,
        'test@example.com',
        null,
        new MemberRole('admin')
      );

      mockOrgRepository.findByIdAsAdmin.mockResolvedValueOnce(mockOrg);
      mockInvitationRepository.findByInviteeEmail.mockResolvedValueOnce(
        existingInvitation
      );

      const command = {
        organizationId: orgId.value,
        inviterUserId: inviterUserIdString,
        inviteeEmail: 'test@example.com',
        role: 'admin' as const,
        inviterName: 'Tester',
      };

      // When
      const result = await service.inviteMember(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('already exists');
    });
  });

  describe('acceptInvitation', () => {
    it('초대를 수락하고 개인 워크스페이스를 생성해야 한다', async () => {
      // Given
      const invitationId = InvitationId.generate();
      const orgId = OrganizationId.generate();
      const inviterUserId = new UserId(crypto.randomUUID());
      const inviteeUserId = new UserId(crypto.randomUUID());
      const inviteeName = 'New Member';

      const mockInvitation = InvitationAggregate.create(
        orgId,
        inviterUserId,
        'test@example.com',
        inviteeUserId,
        new MemberRole('admin')
      );

      mockInvitationRepository.findById.mockResolvedValueOnce(mockInvitation);
      vi.mocked(mockMemberRepository.searchUserProfileByEmail).mockResolvedValueOnce([
        {
          userId: inviteeUserId.value,
          email: 'test@example.com',
          name: inviteeName,
          profileImageUrl: undefined,
        },
      ]);

      const mockPersonalWorkspaceId = crypto.randomUUID();
      const mockPersonalPageId = crypto.randomUUID();
      vi.mocked(mockWorkspaceCrudService.createPersonalWorkspace).mockResolvedValueOnce({
        success: true,
        data: {
          workspaceId: mockPersonalWorkspaceId,
          workspaceName: `${inviteeName}의 개인 워크스페이스`,
          workspaceIsDefault: false,
          firstPageId: mockPersonalPageId,
          firstPageTitle: 'Untitled',
          firstPageIcon: 'File',
        },
      });

      const command = {
        invitationId: invitationId.value,
        inviteeUserId: inviteeUserId.value,
      };

      // When
      const result = await service.acceptInvitation(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockInvitationRepository.save).toHaveBeenCalledTimes(1);
      expect(mockMemberRepository.addMember).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceCrudService.createPersonalWorkspace).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceCrudService.createPersonalWorkspace).toHaveBeenCalledWith(
        orgId,
        inviteeUserId.value,
        inviteeName
      );
    });

    it('개인 워크스페이스 생성 실패 시 멤버 추가가 롤백되어야 한다', async () => {
      // Given
      const invitationId = InvitationId.generate();
      const orgId = OrganizationId.generate();
      const inviterUserId = new UserId(crypto.randomUUID());
      const inviteeUserId = new UserId(crypto.randomUUID());
      const inviteeName = 'New Member';

      const mockInvitation = InvitationAggregate.create(
        orgId,
        inviterUserId,
        'test@example.com',
        inviteeUserId,
        new MemberRole('admin')
      );

      mockInvitationRepository.findById.mockResolvedValueOnce(mockInvitation);
      vi.mocked(mockMemberRepository.searchUserProfileByEmail).mockResolvedValueOnce([
        {
          userId: inviteeUserId.value,
          email: 'test@example.com',
          name: inviteeName,
          profileImageUrl: undefined,
        },
      ]);
      vi.mocked(mockWorkspaceCrudService.createPersonalWorkspace).mockResolvedValueOnce({
        success: false,
        error: 'PERSONAL_WORKSPACE_CREATION_FAILED',
      });

      const command = {
        invitationId: invitationId.value,
        inviteeUserId: inviteeUserId.value,
      };

      // When
      const result = await service.acceptInvitation(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('INVITATION_ACCEPTANCE_FAILED');
      expect(result.error.message).toContain('PERSONAL_WORKSPACE_CREATION_FAILED');
      expect(mockMemberRepository.addMember).toHaveBeenCalledTimes(1);
      expect(mockMemberRepository.removeMember).toHaveBeenCalledTimes(1); // 롤백
    });

    it('존재하지 않는 초대는 에러를 반환해야 한다', async () => {
      // Given
      mockInvitationRepository.findById.mockResolvedValueOnce(null);

      const command = {
        invitationId: InvitationId.generate().value,
        inviteeUserId: crypto.randomUUID(),
      };

      // When
      const result = await service.acceptInvitation(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('Invitation not found');
    });
  });

  describe('rejectInvitation', () => {
    it('초대를 거절해야 한다', async () => {
      // Given
      const invitationId = InvitationId.generate();
      const orgId = OrganizationId.generate();
      const inviterUserId = new UserId(crypto.randomUUID());
      const inviteeUserId = new UserId(crypto.randomUUID());

      const mockInvitation = InvitationAggregate.create(
        orgId,
        inviterUserId,
        'test@example.com',
        inviteeUserId,
        new MemberRole('admin')
      );

      mockInvitationRepository.findById.mockResolvedValueOnce(mockInvitation);

      const command = {
        invitationId: invitationId.value,
        inviteeUserId: inviteeUserId.value,
      };

      // When
      const result = await service.rejectInvitation(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockInvitationRepository.save).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 초대는 에러를 반환해야 한다', async () => {
      // Given
      mockInvitationRepository.findById.mockResolvedValueOnce(null);

      const command = {
        invitationId: InvitationId.generate().value,
        inviteeUserId: crypto.randomUUID(),
      };

      // When
      const result = await service.rejectInvitation(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('Invitation not found');
    });
  });
});

