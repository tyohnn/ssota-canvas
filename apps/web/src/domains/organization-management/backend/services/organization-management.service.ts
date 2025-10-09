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
      // 기본 조직 생성
      const organization = OrganizationAggregate.createDefault(
        command.organizationName,
        new UserId(command.userId)
      );

      await this.organizationRepository.save(organization);

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

          // 조직 상세 정보 조회 (Admin DB 사용 - Application 레벨 권한 검증 완료)
          const org = await this.organizationRepository.findById(
            memberInfo.organizationId,
            true // useAdmin = true (멤버십이 확인된 경우이므로 안전)
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

      // 새로운 조직 생성
      const newOrganization = OrganizationAggregate.createNew(
        command.name,
        command.organizationType,
        new UserId(command.ownerId)
      );

      // 조직 저장
      await this.organizationRepository.save(newOrganization);

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

      // 1. 조직 확인
      const organization = await this.organizationRepository.findById(
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
}
