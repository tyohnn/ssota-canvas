import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { OrganizationRepository } from '../../repositories/interfaces/organization.repository.interface.js';
import { OrganizationMemberRepository } from '../../repositories/interfaces/organization-member.repository.interface.js';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate.js';
import { UserId, OrganizationId } from '../../../shared/value-objects/ids.vo.js';
import { MemberRole } from '../../../shared/value-objects/member-role.vo.js';
import type { WorkspaceCrudService } from '@/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface';
import { DefaultOrganizationCrudService } from '../organization-crud.service.js';

describe('DefaultOrganizationCrudService', () => {
  let service: DefaultOrganizationCrudService;
  let mockOrgRepository: Mocked<OrganizationRepository>;
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
      updateWorkspaceInfo: vi.fn(),
    } as Mocked<WorkspaceCrudService>;

    service = new DefaultOrganizationCrudService(
      mockOrgRepository,
      mockMemberRepository,
      mockWorkspaceCrudService
    );
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
      expect(combinedResults[0]?.role).toBe('owner');
      expect(combinedResults[0]?.id).toBe(ownedOrg.id.value);
      expect(combinedResults[1]?.role).toBe('admin');
      expect(combinedResults[1]?.id).toBe(memberOrg.id.value);
    });

    it('소유자이면서 멤버인 조직은 중복 제거되고 소유자 역할로 표시되어야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const org = OrganizationAggregate.createDefault('My Org', userId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([org]);
      
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
      expect(result.value).toHaveLength(1);
      expect(result.value?.[0]?.role).toBe('owner');
    });

    it('조직 목록을 참여일 기준으로 정렬해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const otherUserId = new UserId(crypto.randomUUID());
      
      const ownedOrg = OrganizationAggregate.createDefault('My Org', userId);
      (ownedOrg.entity as any).createdAt = new Date('2024-01-10');

      const memberOrg1 = OrganizationAggregate.createNew('Org A', 'company', otherUserId);
      const memberOrg2 = OrganizationAggregate.createNew('Org B', 'startup', otherUserId);

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([ownedOrg]);
      
      vi.mocked(mockMemberRepository.findByUserId).mockResolvedValueOnce([
        {
          organizationId: memberOrg2.id,
          userId: userId,
          role: new MemberRole('member'),
          joinedAt: new Date('2024-01-02'),
        },
        {
          organizationId: memberOrg1.id,
          userId: userId,
          role: new MemberRole('admin'),
          joinedAt: new Date('2024-01-01'),
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
      expect(sortedResults[0]?.role).toBe('owner');
      expect(sortedResults[1]?.id).toBe(memberOrg1.id.value);
      expect(sortedResults[2]?.id).toBe(memberOrg2.id.value);
    });
  });

  describe('createDefaultOrganization', () => {
    it('기본 조직, 워크스페이스, Welcome 페이지를 생성하고 리다이렉션 URL을 반환해야 한다', async () => {
      // Given
      const userId = crypto.randomUUID();
      const userName = 'Test User';
      const command = {
        userId,
        organizationName: `${userName}'s Organization`,
      };

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([]);

      const mockWorkspaceId = crypto.randomUUID();
      const mockPageId = crypto.randomUUID();
      vi.mocked(mockWorkspaceCrudService.createDefaultWorkspace).mockResolvedValueOnce({
        success: true,
        data: {
          workspaceId: mockWorkspaceId,
          workspaceName: 'Default Workspace',
          workspaceIsDefault: true,
          firstPageId: mockPageId,
          firstPageTitle: 'Welcome',
          firstPageIcon: 'Sparkles',
        },
      });

      // When
      const result = await service.createDefaultOrganization(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockOrgRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrgRepository.save).toHaveBeenCalledWith(
        expect.any(OrganizationAggregate)
      );
      expect(mockMemberRepository.addMember).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceCrudService.createDefaultWorkspace).toHaveBeenCalledTimes(1);
      expect(mockWorkspaceCrudService.createDefaultWorkspace).toHaveBeenCalledWith(
        expect.any(OrganizationId),
        userId
      );

      if (result.isSuccess()) {
        expect(result.value.organization).toBeDefined();
        expect(result.value.workspace).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.redirectUrl).toMatch(
          /^\/r\/[a-f0-9-]+\/workspace\/[a-f0-9-]+\/page\/[a-f0-9-]+$/
        );
      }
    });

    it('워크스페이스 생성 실패 시 조직 생성이 롤백되어야 한다', async () => {
      // Given
      const userId = crypto.randomUUID();
      const command = {
        userId,
        organizationName: "Test User's Organization",
      };

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([]);
      vi.mocked(mockWorkspaceCrudService.createDefaultWorkspace).mockResolvedValueOnce({
        success: false,
        error: 'WORKSPACE_CREATION_FAILED',
      });

      // When
      const result = await service.createDefaultOrganization(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('ORGANIZATION_CREATION_FAILED');
      expect(result.error.message).toContain('WORKSPACE_CREATION_FAILED');
      expect(mockOrgRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrgRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockMemberRepository.removeMember).toHaveBeenCalledTimes(1);
    });

    it('중복 기본 조직 방지: 이미 기본 조직이 있으면 에러를 반환해야 한다', async () => {
      // Given
      const userId = new UserId(crypto.randomUUID());
      const existingOrg = OrganizationAggregate.createDefault(
        "Existing User's Organization",
        userId
      );

      vi.mocked(mockOrgRepository.findByOwnerId).mockResolvedValueOnce([existingOrg]);

      const command = {
        userId: userId.value,
        organizationName: "Test User's Organization",
      };

      // When
      const result = await service.createDefaultOrganization(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('DEFAULT_ORGANIZATION_ALREADY_EXISTS');
      expect(result.error.message).toContain('already exists');
      expect(mockOrgRepository.save).not.toHaveBeenCalled();
    });
  });
});

