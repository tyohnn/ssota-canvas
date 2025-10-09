// apps/web/src/domains/organization-management/backend/services/organization-management.service.ts

import { OrganizationRepository } from '../repositories/interfaces/organization.repository.interface';
import { OrganizationMemberRepository } from '../repositories/interfaces/organization-member.repository.interface';
import { InvitationRepository } from '../repositories/interfaces/invitation.repository.interface';
import { OrganizationAggregate } from '../../shared/aggregates/organization.aggregate';
import { InvitationAggregate } from '../../shared/aggregates/invitation.aggregate';
import {
  UserId,
  OrganizationId,
  InvitationId,
} from '../../shared/value-objects/ids.vo';
import { MemberRole } from '../../shared/value-objects/member-role.vo';
import { OrganizationManagementError } from '../../shared/errors/organization-management.error';
import { Result } from '@/utils/result';
import {
  CreateDefaultOrganizationCommand,
  CreateNewOrganizationCommand,
  GetUserOrganizationsCommand,
  RequestMemberInvitationCommand,
  AcceptInvitationCommand,
  RejectInvitationCommand,
  ChangeMemberRoleCommand,
} from '../../shared/commands';
import { OrganizationSummary } from '../../shared/dtos';
import { NotificationService } from '@/domains/notification-management/backend/services/notification.service';
import { devLog, eventLog } from '@/utils/dev-logger';

export class OrganizationManagementService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private invitationRepository?: InvitationRepository,
    private organizationMemberRepository?: OrganizationMemberRepository,
    private notificationService?: NotificationService
  ) {}

  async createDefaultOrganization(
    command: CreateDefaultOrganizationCommand
  ): Promise<Result<OrganizationAggregate, OrganizationManagementError>> {
    try {
      const userId = new UserId(command.userId);

      // 기본 조직 생성
      const organization = OrganizationAggregate.createDefault(
        command.organizationName,
        userId
      );

      // 조직 저장
      await this.organizationRepository.save(organization);

      // ✨ 소유자를 organization_members 테이블에 추가
      if (this.organizationMemberRepository) {
        await this.organizationMemberRepository.addMember({
          organizationId: organization.id,
          userId: userId,
          role: new MemberRole('owner'),
          joinedAt: new Date(),
        });
      }

      return Result.success(organization);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create default organization',
          { error }
        )
      );
    }
  }

  async getUserOrganizations(
    command: GetUserOrganizationsCommand
  ): Promise<Result<OrganizationSummary[], OrganizationManagementError>> {
    try {
      const userId = new UserId(command.userId);

      // Map을 사용하여 조직 정보와 참여일 함께 관리
      const organizationData = new Map<
        string,
        { summary: OrganizationSummary; sortKey: Date }
      >();

      // 1. 소유자인 조직 조회
      const ownedOrganizations =
        await this.organizationRepository.findByOwnerId(userId);

      for (const org of ownedOrganizations) {
        organizationData.set(org.id.value, {
          summary: {
            id: org.id.value,
            name: org.entity.name,
            organizationType: org.entity.organizationType,
            isDefault: org.entity.isDefault,
            role: 'owner',
            createdAt: org.entity.createdAt.toISOString(),
          },
          sortKey: org.entity.createdAt, // 소유자 조직은 생성일로 정렬
        });
      }

      // 2. 멤버로 속한 조직 조회
      if (this.organizationMemberRepository) {
        const memberInfos =
          await this.organizationMemberRepository.findByUserId(userId);

        for (const memberInfo of memberInfos) {
          // 이미 소유자로 추가된 조직은 건너뜀 (중복 방지)
          if (organizationData.has(memberInfo.organizationId.value)) {
            continue;
          }

          // 조직 상세 정보 조회 (Admin DB 사용 - 멤버십 확인 완료)
          const org = await this.organizationRepository.findByIdAsAdmin(
            memberInfo.organizationId
          );

          if (org) {
            organizationData.set(org.id.value, {
              summary: {
                id: org.id.value,
                name: org.entity.name,
                organizationType: org.entity.organizationType,
                isDefault: org.entity.isDefault,
                role: memberInfo.role.value as 'owner' | 'admin' | 'member',
                createdAt: org.entity.createdAt.toISOString(),
              },
              sortKey: memberInfo.joinedAt, // 멤버 조직은 참여일로 정렬
            });
          }
        }
      }

      // 3. 정렬: 소유자 조직 먼저, 그 다음 참여일 오름차순
      const sortedOrganizations = Array.from(organizationData.values())
        .sort((a, b) => {
          // 소유자 조직 우선
          if (a.summary.role === 'owner' && b.summary.role !== 'owner') {
            return -1;
          }
          if (a.summary.role !== 'owner' && b.summary.role === 'owner') {
            return 1;
          }
          // 같은 타입이면 날짜 순서
          return a.sortKey.getTime() - b.sortKey.getTime();
        })
        .map(item => item.summary);

      return Result.success(sortedOrganizations);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_RETRIEVAL_FAILED',
          'Failed to get user organizations',
          { error }
        )
      );
    }
  }

  async createNewOrganization(
    command: CreateNewOrganizationCommand
  ): Promise<Result<OrganizationSummary, OrganizationManagementError>> {
    try {
      // 조직 이름 중복 검사
      const existingOrganizations =
        await this.organizationRepository.findByOwnerId(
          new UserId(command.ownerId)
        );

      const duplicateOrg = existingOrganizations.find(
        org => org.entity.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateOrg) {
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NAME_DUPLICATE',
            'Organization with this name already exists'
          )
        );
      }

      const ownerId = new UserId(command.ownerId);

      // 새로운 조직 생성
      const newOrganization = OrganizationAggregate.createNew(
        command.name,
        command.organizationType,
        ownerId
      );

      // 조직 저장
      await this.organizationRepository.save(newOrganization);

      // ✨ 소유자를 organization_members 테이블에 추가
      if (this.organizationMemberRepository) {
        await this.organizationMemberRepository.addMember({
          organizationId: newOrganization.id,
          userId: ownerId,
          role: new MemberRole('owner'),
          joinedAt: new Date(),
        });
      }

      // DTO로 변환하여 반환
      const organizationSummary: OrganizationSummary = {
        id: newOrganization.id.value,
        name: newOrganization.entity.name,
        organizationType: newOrganization.entity.organizationType,
        isDefault: newOrganization.entity.isDefault,
        role: 'owner',
        createdAt: newOrganization.entity.createdAt.toISOString(),
      };

      return Result.success(organizationSummary);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'ORGANIZATION_CREATION_FAILED',
          'Failed to create new organization',
          { error }
        )
      );
    }
  }

  async inviteMember(
    command: RequestMemberInvitationCommand
  ): Promise<Result<InvitationAggregate, OrganizationManagementError>> {
    if (!this.invitationRepository) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Invitation repository not initialized'
        )
      );
    }

    try {
      devLog('[inviteMember] Checking organization', {
        organizationId: command.organizationId,
      });

      // 1. 조직 확인 (Admin DB - Admin도 초대 가능하므로)
      const organization = await this.organizationRepository.findByIdAsAdmin(
        new OrganizationId(command.organizationId)
      );

      if (!organization) {
        console.error(
          '[inviteMember] Organization not found:',
          command.organizationId
        );
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NOT_FOUND',
            'Organization not found'
          )
        );
      }

      // 2. 초대자 권한 확인 (소유자 또는 관리자)
      const inviterUserId = new UserId(command.inviterUserId);
      const isOwner = organization.ownerId.equals(inviterUserId);

      if (!isOwner) {
        // Owner가 아니면 organization_members에서 Admin인지 확인
        if (!this.organizationMemberRepository) {
          console.error(
            '[inviteMember] organizationMemberRepository not available'
          );
          return Result.error(
            new OrganizationManagementError(
              'INSUFFICIENT_PERMISSIONS',
              'Cannot verify permissions'
            )
          );
        }

        const inviterRole =
          await this.organizationMemberRepository.findMemberRole(
            new OrganizationId(command.organizationId),
            inviterUserId
          );

        const isAdmin = inviterRole?.value === 'admin';
        if (!isAdmin) {
          console.error('[inviteMember] Unauthorized', {
            userId: command.inviterUserId,
            role: inviterRole?.value,
          });
          return Result.error(
            new OrganizationManagementError(
              'INSUFFICIENT_PERMISSIONS',
              'Only owners and admins can invite members'
            )
          );
        }
      }

      // 3. 중복 초대 확인
      const existingInvitation =
        await this.invitationRepository.findByInviteeEmail(
          command.inviteeEmail,
          new OrganizationId(command.organizationId)
        );

      if (existingInvitation) {
        console.error('[inviteMember] Duplicate invitation', {
          email: command.inviteeEmail,
        });
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_EXISTS',
            'An invitation for this email already exists'
          )
        );
      }
      // 4. 초대받을 사용자가 이미 가입되어 있는지 확인
      if (!this.organizationMemberRepository) {
        console.error(
          '[inviteMember] organizationMemberRepository not available'
        );
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_CREATION_FAILED',
            'Cannot search for user profile'
          )
        );
      }

      const userProfiles =
        await this.organizationMemberRepository.searchUserProfileByEmail(
          command.inviteeEmail
        );
      const inviteeUserId =
        userProfiles.length > 0 ? userProfiles[0]?.userId : null;

      devLog('[inviteMember] Invitee search result', {
        email: command.inviteeEmail,
        found: userProfiles.length > 0,
      });

      // 5. 초대 생성
      const invitation = InvitationAggregate.create(
        new OrganizationId(command.organizationId),
        new UserId(command.inviterUserId),
        command.inviteeEmail,
        inviteeUserId ? new UserId(inviteeUserId) : null, // 가입된 사용자면 userId 포함
        new MemberRole(command.role)
      );

      // 6. 초대 저장
      await this.invitationRepository.save(invitation);

      // 7. Notification 생성 (Notification Management Domain)
      // Policy: "Whenever 멤버 초대 요청함, then always 멤버 초대 알림 추가"
      if (invitation.entity.inviteeUserId && this.notificationService) {
        // 조직 이름 조회
        const organizationName = organization.entity.name;

        // Notification 생성 요청 (Notification Management Domain)
        const notificationResult =
          await this.notificationService.createInvitationNotification({
            userId: invitation.entity.inviteeUserId.value,
            invitationId: invitation.id.value,
            organizationName: organizationName,
            inviterName: command.inviterName,
            role: command.role,
          });

        if (notificationResult.isError()) {
          console.error(
            '[inviteMember] Failed to create notification:',
            notificationResult.error
          );
          // Notification 생성 실패는 초대 생성 자체를 실패시키지 않음 (비즈니스 정책)
        }
      }

      // 핵심 이벤트 로그 (Production: 10% 샘플링)
      eventLog('[inviteMember] Success', {
        invitationId: invitation.id.value,
        inviteeEmail: command.inviteeEmail,
        role: command.role,
        hasNotification: !!invitation.entity.inviteeUserId,
      });

      return Result.success(invitation);
    } catch (error) {
      console.error('[inviteMember] Caught error:', error);
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Failed to create invitation',
          { error }
        )
      );
    }
  }

  async acceptInvitation(
    command: AcceptInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>> {
    if (!this.invitationRepository) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Invitation repository not initialized'
        )
      );
    }

    if (!this.organizationMemberRepository) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Organization member repository not initialized'
        )
      );
    }

    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepository.findById(
        new InvitationId(command.invitationId)
      );

      if (!invitation) {
        console.error(
          '[acceptInvitation] Invitation not found:',
          command.invitationId
        );
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_NOT_FOUND',
            'Invitation not found'
          )
        );
      }

      // 2. 초대 상태 확인
      if (!invitation.entity.isPending()) {
        console.error('[acceptInvitation] Already responded', {
          status: invitation.entity.status,
        });
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_RESPONDED',
            'Invitation has already been responded to'
          )
        );
      }

      // 3. 초대 승낙
      const inviteeUserId = new UserId(command.inviteeUserId);
      invitation.acceptInvitation(inviteeUserId);

      // 4. 초대 업데이트
      await this.invitationRepository.save(invitation);

      // 5. organization_members 테이블에 멤버 추가
      await this.organizationMemberRepository.addMember({
        organizationId: invitation.entity.organizationId,
        userId: inviteeUserId,
        role: invitation.entity.role,
        joinedAt: new Date(),
      });

      // 핵심 이벤트 로그 (Production: 10% 샘플링)
      eventLog('[acceptInvitation] Success', {
        invitationId: invitation.id.value,
        organizationId: invitation.entity.organizationId.value,
        userId: command.inviteeUserId,
        role: invitation.entity.role.value,
      });

      return Result.success(undefined);
    } catch (error) {
      console.error('[acceptInvitation] Caught error:', error);
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Failed to accept invitation',
          { error }
        )
      );
    }
  }

  async rejectInvitation(
    command: RejectInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>> {
    if (!this.invitationRepository) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Invitation repository not initialized'
        )
      );
    }

    try {
      // 1. 초대 조회
      const invitation = await this.invitationRepository.findById(
        new InvitationId(command.invitationId)
      );

      if (!invitation) {
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_NOT_FOUND',
            'Invitation not found'
          )
        );
      }

      // 2. 초대 상태 확인
      if (!invitation.entity.isPending()) {
        return Result.error(
          new OrganizationManagementError(
            'INVITATION_ALREADY_RESPONDED',
            'Invitation has already been responded to'
          )
        );
      }

      // 3. 초대 거절
      const inviteeUserId = new UserId(command.inviteeUserId);
      invitation.rejectInvitation(inviteeUserId);

      // 4. 초대 업데이트
      await this.invitationRepository.save(invitation);

      return Result.success(undefined);
    } catch (error) {
      return Result.error(
        new OrganizationManagementError(
          'INVITATION_CREATION_FAILED',
          'Failed to reject invitation',
          { error }
        )
      );
    }
  }

  async changeMemberRole(
    command: ChangeMemberRoleCommand
  ): Promise<
    Result<
      { type: 'MemberPromotedToAdmin' | 'AdminDemotedToMember' },
      OrganizationManagementError
    >
  > {
    if (!this.organizationMemberRepository) {
      return Result.error(
        new OrganizationManagementError(
          'MEMBER_MANAGEMENT_FAILED',
          'Organization member repository not initialized'
        )
      );
    }

    try {
      const organizationId = new OrganizationId(command.organizationId);
      const targetUserId = new UserId(command.userId);
      const currentUserId = new UserId(command.requesterId);
      const newRole = new MemberRole(command.newRole);

      // Step 1: 조직 조회 (Admin DB - Admin도 역할 변경 가능하므로)
      const organization =
        await this.organizationRepository.findByIdAsAdmin(organizationId);
      if (!organization) {
        return Result.error(
          new OrganizationManagementError(
            'ORGANIZATION_NOT_FOUND',
            'Organization not found'
          )
        );
      }

      // Step 2: 현재 사용자 권한 확인 (organization_members에서 조회)
      const currentUserMemberRole =
        await this.organizationMemberRepository.findMemberRole(
          organizationId,
          currentUserId
        );

      if (!currentUserMemberRole) {
        return Result.error(
          new OrganizationManagementError(
            'INSUFFICIENT_PERMISSIONS',
            'User is not a member of this organization'
          )
        );
      }

      const currentUserRole = currentUserMemberRole.value as
        | 'owner'
        | 'admin'
        | 'member';

      if (currentUserRole === 'member') {
        return Result.error(
          new OrganizationManagementError(
            'INSUFFICIENT_PERMISSIONS',
            'Member does not have permission to change roles'
          )
        );
      }

      // Step 3: 대상 멤버 역할 조회 및 검증 (organization_members에서 조회)
      const targetMemberMemberRole =
        await this.organizationMemberRepository.findMemberRole(
          organizationId,
          targetUserId
        );

      if (!targetMemberMemberRole) {
        return Result.error(
          new OrganizationManagementError(
            'MEMBER_MANAGEMENT_FAILED',
            'Target user is not a member of this organization'
          )
        );
      }

      const targetMemberRole = targetMemberMemberRole.value as
        | 'owner'
        | 'admin'
        | 'member';

      // Step 3-1: 관리자가 관리자를 강등하려는 경우 명시적으로 체크 (Service Layer)
      if (
        currentUserRole === 'admin' &&
        targetMemberRole === 'admin' &&
        newRole.value === 'member'
      ) {
        return Result.error(
          new OrganizationManagementError(
            'ADMIN_CANNOT_DEMOTE_ADMIN',
            'Admin cannot demote another admin'
          )
        );
      }

      // Step 4: 계층적 권한 시스템 검증 (OrganizationAggregate로 위임)
      // OrganizationAggregate의 changeMemberRole 메서드 호출
      // 이 메서드는 다음을 검증합니다:
      // - 소유자 역할 변경 방지
      // - 자기 자신 역할 변경 방지
      // - 현재 역할과 동일한 역할로 변경 방지
      // - 관리자는 관리자를 강등할 수 없음
      const event = organization.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole.value as 'admin' | 'member'
      );

      // Step 5: adminDb로 역할 업데이트 (organization_members 테이블)
      await this.organizationMemberRepository.updateMemberRole(
        organizationId,
        targetUserId,
        newRole
      );

      // Step 6: 권한 캐시 무효화 (즉시 권한 반영)
      // TODO: 권한 캐시 무효화 로직 구현 (향후 캐시 시스템 도입 시)

      // 핵심 이벤트 로그
      eventLog('[changeMemberRole] Success', {
        organizationId: organizationId.value,
        targetUserId: targetUserId.value,
        currentUserId: currentUserId.value,
        oldRole: targetMemberRole,
        newRole: newRole.value,
        eventType: event.type,
      });

      return Result.success({ type: event.type });
    } catch (error) {
      // OrganizationAggregate에서 발생한 에러는 그대로 전파
      if (error instanceof OrganizationManagementError) {
        return Result.error(error);
      }

      console.error('[changeMemberRole] Unexpected error:', error);
      return Result.error(
        new OrganizationManagementError(
          'MEMBER_MANAGEMENT_FAILED',
          'Failed to change member role',
          { error }
        )
      );
    }
  }
}
