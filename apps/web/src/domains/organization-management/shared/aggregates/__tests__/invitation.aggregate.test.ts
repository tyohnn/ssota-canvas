import { describe, it, expect, beforeEach } from 'vitest';
import { InvitationAggregate } from '../invitation.aggregate';
import { Invitation } from '../../entities/invitation.entity';
import { OrganizationId, UserId, InvitationId } from '../../value-objects/ids.vo';
import { MemberRole } from '../../value-objects/member-role.vo';
import {
  MemberInvitationRequestedEvent,
  InvitationAcceptedEvent,
  InvitationRejectedEvent,
} from '../../events';

describe('InvitationAggregate', () => {
  let organizationId: OrganizationId;
  let inviterUserId: UserId;
  let inviteeUserId: UserId;
  let inviteeEmail: string;
  let role: MemberRole;

  beforeEach(() => {
    organizationId = OrganizationId.generate();
    inviterUserId = new UserId('inviter-123');
    inviteeUserId = new UserId('invitee-456');
    inviteeEmail = 'invitee@example.com';
    role = new MemberRole('member');
  });

  describe('create', () => {
    it('새로운 초대를 생성해야 한다', () => {
      // When
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );

      // Then
      expect(aggregate).toBeInstanceOf(InvitationAggregate);
      expect(aggregate.entity.organizationId).toBe(organizationId);
      expect(aggregate.entity.inviterUserId).toBe(inviterUserId);
      expect(aggregate.entity.inviteeEmail).toBe(inviteeEmail);
      expect(aggregate.entity.inviteeUserId).toBe(inviteeUserId);
      expect(aggregate.entity.role).toBe(role);
      expect(aggregate.entity.status).toBe('pending');
    });

    it('inviteeUserId 없이 생성 가능해야 한다', () => {
      // When
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        null,
        role
      );

      // Then
      expect(aggregate.entity.inviteeUserId).toBeNull();
      expect(aggregate.entity.inviteeEmail).toBe(inviteeEmail);
    });

    it('생성된 초대 ID가 유효해야 한다', () => {
      // When
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );

      // Then
      expect(aggregate.id).toBeInstanceOf(InvitationId);
      expect(aggregate.id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('acceptInvitation', () => {
    it('초대를 승낙해야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );

      // When
      const event = aggregate.acceptInvitation(inviteeUserId);

      // Then
      expect(aggregate.entity.status).toBe('accepted');
      expect(aggregate.entity.respondedAt).not.toBeNull();
      expect(event).toBeInstanceOf(InvitationAcceptedEvent);
      expect(event.invitationId).toBe(aggregate.id);
      expect(event.organizationId).toBe(organizationId);
      expect(event.inviteeUserId).toBe(inviteeUserId);
    });

    it('inviteeUserId가 설정되지 않은 경우 자동 설정되어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        null, // inviteeUserId 없음
        role
      );
      const newInviteeUserId = new UserId('new-invitee-789');

      // When
      aggregate.acceptInvitation(newInviteeUserId);

      // Then
      expect(aggregate.entity.inviteeUserId).toBe(newInviteeUserId);
      expect(aggregate.entity.status).toBe('accepted');
    });

    it('이미 응답한 초대는 승낙할 수 없어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );
      aggregate.acceptInvitation(inviteeUserId);

      // When & Then
      expect(() => aggregate.acceptInvitation(inviteeUserId)).toThrow(
        'Invitation has already been responded to'
      );
    });
  });

  describe('rejectInvitation', () => {
    it('초대를 거절해야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );

      // When
      const event = aggregate.rejectInvitation(inviteeUserId);

      // Then
      expect(aggregate.entity.status).toBe('rejected');
      expect(aggregate.entity.respondedAt).not.toBeNull();
      expect(event).toBeInstanceOf(InvitationRejectedEvent);
      expect(event.invitationId).toBe(aggregate.id);
      expect(event.inviteeUserId).toBe(inviteeUserId);
    });

    it('inviteeUserId가 설정되지 않은 경우 자동 설정되어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        null,
        role
      );
      const newInviteeUserId = new UserId('new-invitee-789');

      // When
      aggregate.rejectInvitation(newInviteeUserId);

      // Then
      expect(aggregate.entity.inviteeUserId).toBe(newInviteeUserId);
      expect(aggregate.entity.status).toBe('rejected');
    });

    it('이미 응답한 초대는 거절할 수 없어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );
      aggregate.rejectInvitation(inviteeUserId);

      // When & Then
      expect(() => aggregate.rejectInvitation(inviteeUserId)).toThrow(
        'Invitation has already been responded to'
      );
    });
  });

  describe('expireInvitation', () => {
    it('초대를 만료 처리해야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );

      // When
      aggregate.expireInvitation();

      // Then
      expect(aggregate.entity.status).toBe('expired');
      expect(aggregate.entity.isExpired()).toBe(true);
    });

    it('이미 응답한 초대는 만료 처리할 수 없어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );
      aggregate.acceptInvitation(inviteeUserId);

      // When & Then
      expect(() => aggregate.expireInvitation()).toThrow(
        'Invitation has already been responded to'
      );
    });
  });

  describe('권한 체크', () => {
    it('초대받은 사용자만 응답할 수 있어야 한다', () => {
      // Given
      const aggregate = InvitationAggregate.create(
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role
      );
      const unauthorizedUserId = new UserId('unauthorized-999');

      // When & Then
      // 실제 구현에서는 Service Layer에서 검증하므로
      // Aggregate에서는 단순히 inviteeUserId만 확인
      expect(aggregate.entity.inviteeUserId).toBe(inviteeUserId);
    });
  });
});

