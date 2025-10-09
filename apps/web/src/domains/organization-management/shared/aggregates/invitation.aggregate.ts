// apps/web/src/domains/organization-management/shared/aggregates/invitation.aggregate.ts

import { Invitation } from '../entities/invitation.entity';
import { OrganizationId, UserId, InvitationId } from '../value-objects/ids.vo';
import { MemberRole } from '../value-objects/member-role.vo';
import {
  MemberInvitationRequestedEvent,
  InvitationAcceptedEvent,
  InvitationRejectedEvent,
} from '../events';

export class InvitationAggregate {
  constructor(private invitation: Invitation) {}

  // Command 처리: 초대 생성
  static create(
    organizationId: OrganizationId,
    inviterUserId: UserId,
    inviteeEmail: string,
    inviteeUserId: UserId | null,
    role: MemberRole
  ): InvitationAggregate {
    const invitation = new Invitation(
      InvitationId.generate(),
      organizationId,
      inviterUserId,
      inviteeEmail,
      inviteeUserId,
      role,
      'pending',
      new Date(),
      null
    );

    return new InvitationAggregate(invitation);
  }

  // Command 처리: 초대 승낙
  acceptInvitation(inviteeUserId: UserId): InvitationAcceptedEvent {
    // inviteeUserId가 없으면 설정
    if (!this.invitation.inviteeUserId) {
      this.invitation.setInviteeUserId(inviteeUserId);
    }

    this.invitation.accept();

    return new InvitationAcceptedEvent(
      this.invitation.id,
      this.invitation.organizationId,
      inviteeUserId
    );
  }

  // Command 처리: 초대 거절
  rejectInvitation(inviteeUserId: UserId): InvitationRejectedEvent {
    // inviteeUserId가 없으면 설정
    if (!this.invitation.inviteeUserId) {
      this.invitation.setInviteeUserId(inviteeUserId);
    }

    this.invitation.reject();

    return new InvitationRejectedEvent(this.invitation.id, inviteeUserId);
  }

  // Command 처리: 초대 만료
  expireInvitation(): void {
    this.invitation.expire();
  }

  // Getters
  get id(): InvitationId {
    return this.invitation.id;
  }

  get entity(): Invitation {
    return this.invitation;
  }

  get organizationId(): OrganizationId {
    return this.invitation.organizationId;
  }

  get inviteeEmail(): string {
    return this.invitation.inviteeEmail;
  }

  get status(): string {
    return this.invitation.status;
  }
}
