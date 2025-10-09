import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { OrganizationManagementService } from '../organization-management.service.js';
import { OrganizationRepository } from '../../repositories/interfaces/organization.repository.interface.js';
import { InvitationRepository } from '../../repositories/interfaces/invitation.repository.interface.js';
import { OrganizationMemberRepository } from '../../repositories/interfaces/organization-member.repository.interface.js';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate.js';
import { InvitationAggregate } from '../../../shared/aggregates/invitation.aggregate.js';
import { UserId, OrganizationId, InvitationId } from '../../../shared/value-objects/ids.vo.js';
import { MemberRole } from '../../../shared/value-objects/member-role.vo.js';

describe('OrganizationManagementService', () => {
  let service: OrganizationManagementService;
  let mockOrgRepository: Mocked<OrganizationRepository>;
  let mockInvitationRepository: Mocked<InvitationRepository>;
  let mockMemberRepository: Mocked<OrganizationMemberRepository>;

  beforeEach(() => {
    mockOrgRepository = {
      save: vi.fn<OrganizationRepository['save']>(),
      findById: vi.fn<OrganizationRepository['findById']>(),
      findByIdAsAdmin: vi.fn<OrganizationRepository['findByIdAsAdmin']>(),
      findByOwnerId: vi.fn<OrganizationRepository['findByOwnerId']>(),
      delete: vi.fn<OrganizationRepository['delete']>(),
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

    service = new OrganizationManagementService(
      mockOrgRepository,
      mockInvitationRepository,
      mockMemberRepository
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
      // searchUserProfileByEmail mock 추가
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
      // searchUserProfileByEmail은 호출되지 않음 (중복 초대 검증에서 실패)

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
    it('초대를 수락해야 한다', async () => {
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
      const result = await service.acceptInvitation(command);

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

  describe('getUserOrganizations', () => {
    it('소유자인 조직만 있는 경우 조직 목록을 반환해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const ownedOrg1 = OrganizationAggregate.createDefault('My Org 1', userId);
      const ownedOrg2 = OrganizationAggregate.createNew(
        'My Org 2',
        'startup',
        userId
      );

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([
        ownedOrg1,
        ownedOrg2,
      ]);
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([]);

      const command = { userId: userId.value };

      // When
      const result = await service.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveLength(2);
      const ownerResults = result.value ?? [];
      expect(ownerResults[0]?.role).toBe('owner');
      expect(ownerResults[1]?.role).toBe('owner');
    });

    it('멤버인 조직만 있는 경우 조직 목록을 반환해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const otherUserId = new UserId(crypto.randomUUID());
      const org1 = OrganizationAggregate.createDefault('Other Org 1', otherUserId);
      const org2 = OrganizationAggregate.createNew('Other Org 2', 'company', otherUserId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([]);
      
      // 멤버십 정보
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([
        {
          organizationId: org1.id,
          userId: userId,
          role: new MemberRole('admin'),
          joinedAt: new Date('2024-01-01'),
        },
        {
          organizationId: org2.id,
          userId: userId,
          role: new MemberRole('member'),
          joinedAt: new Date('2024-01-02'),
        },
      ]);

      // 조직 상세 조회
      vi.mocked(mockOrgRepository.findByIdAsAdmin)
        .mockResolvedValueOnce(org1)
        .mockResolvedValueOnce(org2);

      const command = { userId: userId.value };

      // When
      const result = await service.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveLength(2);
      const memberResults = result.value ?? [];
      expect(memberResults[0]?.role).toBe('admin');
      expect(memberResults[1]?.role).toBe('member');
      expect(memberResults[0]?.id).toBe(org1.id.value);
      expect(memberResults[1]?.id).toBe(org2.id.value);
    });

    it('소유자 + 멤버 조직을 모두 반환해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const otherUserId = new UserId(crypto.randomUUID());
      
      const ownedOrg = OrganizationAggregate.createDefault('My Org', userId);
      const memberOrg = OrganizationAggregate.createNew('Other Org', 'company', otherUserId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([ownedOrg]);
      
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([
        {
          organizationId: memberOrg.id,
          userId: userId,
          role: new MemberRole('admin'),
          joinedAt: new Date('2024-01-15'),
        },
      ]);

      vi.mocked(mockOrgRepository.findByIdAsAdmin).mockResolvedValueOnce(memberOrg);

      const command = { userId: userId.value };

      // When
      const result = await service.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveLength(2);
      const combinedResults = result.value ?? [];
      // 소유자 조직이 먼저
      expect(combinedResults[0]?.role).toBe('owner');
      expect(combinedResults[0]?.id).toBe(ownedOrg.id.value);
      // 멤버 조직이 나중
      expect(combinedResults[1]?.role).toBe('admin');
      expect(combinedResults[1]?.id).toBe(memberOrg.id.value);
    });

    it('소유자이면서 멤버인 조직은 중복 제거되고 소유자 역할로 표시되어야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const org = OrganizationAggregate.createDefault('My Org', userId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([org]);
      
      // 동일한 조직에 멤버로도 등록됨 (edge case)
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([
        {
          organizationId: org.id,
          userId: userId,
          role: new MemberRole('member'),
          joinedAt: new Date('2024-01-01'),
        },
      ]);

      const command = { userId: userId.value };

      // When
      const result = await service.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveLength(1); // 중복 제거됨
      expect(result.value?.[0]?.role).toBe('owner'); // 소유자 역할 우선
    });

    it('조직 목록을 참여일 기준으로 정렬해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const otherUserId = new UserId(crypto.randomUUID());
      
      // 소유자 조직 (2024-01-10 생성)
      const ownedOrg = OrganizationAggregate.createDefault('My Org', userId);
      // createdAt을 강제로 설정
      (ownedOrg.entity as any).createdAt = new Date('2024-01-10');

      // 멤버 조직들
      const memberOrg1 = OrganizationAggregate.createNew('Org A', 'company', otherUserId);
      const memberOrg2 = OrganizationAggregate.createNew('Org B', 'startup', otherUserId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([ownedOrg]);
      
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([
        {
          organizationId: memberOrg2.id,
          userId: userId,
          role: new MemberRole('member'),
          joinedAt: new Date('2024-01-02'), // 나중에 참여
        },
        {
          organizationId: memberOrg1.id,
          userId: userId,
          role: new MemberRole('admin'),
          joinedAt: new Date('2024-01-01'), // 먼저 참여
        },
      ]);

      vi.mocked(mockOrgRepository.findByIdAsAdmin)
        .mockResolvedValueOnce(memberOrg2)
        .mockResolvedValueOnce(memberOrg1);

      const command = { userId: userId.value };

      // When
      const result = await service.getUserOrganizations(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value).toHaveLength(3);

      const sortedResults = result.value ?? [];
      // 순서 확인: 소유자 조직 먼저, 그 다음 참여일 순서
      expect(sortedResults[0]?.role).toBe('owner'); // 소유자 조직
      expect(sortedResults[1]?.id).toBe(memberOrg1.id.value); // 2024-01-01 참여
      expect(sortedResults[2]?.id).toBe(memberOrg2.id.value); // 2024-01-02 참여
    });
  });
});
