// apps/web/src/domains/organization-management/backend/services/interfaces/organization-invitation.service.interface.ts

import type { Result } from '@/utils/result';
import type { OrganizationManagementError } from '../../../shared/errors/organization-management.error';
import type { InvitationAggregate } from '../../../shared/aggregates/invitation.aggregate';
import type {
  RequestMemberInvitationCommand,
  AcceptInvitationCommand,
  RejectInvitationCommand,
} from '../../../shared/commands';

/**
 * Organization Invitation Service Interface
 *
 * 조직 멤버 초대, 수락, 거절을 담당
 */
export interface OrganizationInvitationService {
  /**
   * 조직에 멤버 초대
   * - Owner 또는 Admin만 가능
   * - 초대 성공 시 Notification 자동 생성
   */
  inviteMember(
    command: RequestMemberInvitationCommand
  ): Promise<Result<InvitationAggregate, OrganizationManagementError>>;

  /**
   * 초대 수락
   * - 초대받은 사용자만 가능
   * - 수락 시 organization_members에 추가
   * - 관련 Notification 읽음 처리
   */
  acceptInvitation(
    command: AcceptInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>>;

  /**
   * 초대 거절
   * - 초대받은 사용자만 가능
   * - 관련 Notification 읽음 처리
   */
  rejectInvitation(
    command: RejectInvitationCommand
  ): Promise<Result<void, OrganizationManagementError>>;
}
