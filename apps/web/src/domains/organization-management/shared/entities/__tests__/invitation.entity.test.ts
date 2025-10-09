import { describe, it, expect, beforeEach } from 'vitest';
import { Invitation } from '../invitation.entity.js';
import { OrganizationId, UserId, InvitationId } from '../../value-objects/ids.vo.js';
import { MemberRole } from '../../value-objects/member-role.vo.js';

describe('Invitation Entity', () => {
  let invitationId: InvitationId;
  let organizationId: OrganizationId;
  let inviterUserId: UserId;
  let inviteeUserId: UserId;
  let role: MemberRole;
  let inviteeEmail: string;

  beforeEach(() => {
    invitationId = InvitationId.generate();
    organizationId = OrganizationId.generate();
    inviterUserId = new UserId('inviter-123');
    inviteeUserId = new UserId('invitee-456');
    role = new MemberRole('member');
    inviteeEmail = 'invitee@example.com';
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const createdAt = new Date();

      // When
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        createdAt,
        null
      );

      // Then
      expect(invitation.id).toBe(invitationId);
      expect(invitation.organizationId).toBe(organizationId);
      expect(invitation.inviterUserId).toBe(inviterUserId);
      expect(invitation.inviteeEmail).toBe(inviteeEmail);
      expect(invitation.inviteeUserId).toBe(inviteeUserId);
      expect(invitation.role).toBe(role);
      expect(invitation.status).toBe('pending');
      expect(invitation.createdAt).toBe(createdAt);
      expect(invitation.respondedAt).toBeNull();
    });

    it('초기 상태는 pending이어야 한다', () => {
      // When
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );

      // Then
      expect(invitation.status).toBe('pending');
      expect(invitation.isPending()).toBe(true);
    });

    it('inviteeUserId 없이 생성 가능해야 한다 (이메일만으로 초대)', () => {
      // When
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        null,
        role,
        'pending',
        new Date(),
        null
      );

      // Then
      expect(invitation.inviteeUserId).toBeNull();
      expect(invitation.inviteeEmail).toBe(inviteeEmail);
    });
  });

  describe('accept', () => {
    it('초대를 승낙해야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );

      // When
      invitation.accept();

      // Then
      expect(invitation.status).toBe('accepted');
      expect(invitation.respondedAt).not.toBeNull();
      expect(invitation.isAccepted()).toBe(true);
    });

    it('응답 시간이 기록되어야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );
      const beforeAccept = new Date();

      // When
      invitation.accept();
      const afterAccept = new Date();

      // Then
      expect(invitation.respondedAt).not.toBeNull();
      expect(invitation.respondedAt!.getTime()).toBeGreaterThanOrEqual(beforeAccept.getTime());
      expect(invitation.respondedAt!.getTime()).toBeLessThanOrEqual(afterAccept.getTime());
    });

    it('이미 처리된 초대는 승낙할 수 없어야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'accepted',
        new Date(),
        new Date()
      );

      // When & Then
      expect(() => invitation.accept()).toThrow('Invitation has already been responded to');
    });
  });

  describe('reject', () => {
    it('초대를 거절해야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );

      // When
      invitation.reject();

      // Then
      expect(invitation.status).toBe('rejected');
      expect(invitation.respondedAt).not.toBeNull();
      expect(invitation.isRejected()).toBe(true);
    });

    it('응답 시간이 기록되어야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );
      const beforeReject = new Date();

      // When
      invitation.reject();
      const afterReject = new Date();

      // Then
      expect(invitation.respondedAt).not.toBeNull();
      expect(invitation.respondedAt!.getTime()).toBeGreaterThanOrEqual(beforeReject.getTime());
      expect(invitation.respondedAt!.getTime()).toBeLessThanOrEqual(afterReject.getTime());
    });

    it('이미 처리된 초대는 거절할 수 없어야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'rejected',
        new Date(),
        new Date()
      );

      // When & Then
      expect(() => invitation.reject()).toThrow('Invitation has already been responded to');
    });
  });

  describe('expire', () => {
    it('초대를 만료 처리해야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );

      // When
      invitation.expire();

      // Then
      expect(invitation.status).toBe('expired');
      expect(invitation.isExpired()).toBe(true);
    });

    it('이미 처리된 초대는 만료할 수 없어야 한다', () => {
      // Given
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'accepted',
        new Date(),
        new Date()
      );

      // When & Then
      expect(() => invitation.expire()).toThrow('Invitation has already been responded to');
    });
  });

  describe('상태 체크 메서드', () => {
    it('isPending은 pending 상태일 때 true여야 한다', () => {
      // When
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'pending',
        new Date(),
        null
      );

      // Then
      expect(invitation.isPending()).toBe(true);
      expect(invitation.isAccepted()).toBe(false);
      expect(invitation.isRejected()).toBe(false);
      expect(invitation.isExpired()).toBe(false);
    });

    it('isAccepted는 accepted 상태일 때 true여야 한다', () => {
      // When
      const invitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'accepted',
        new Date(),
        new Date()
      );

      // Then
      expect(invitation.isAccepted()).toBe(true);
      expect(invitation.isPending()).toBe(false);
    });

    it('hasResponded는 응답된 초대일 때 true여야 한다', () => {
      // Given
      const acceptedInvitation = new Invitation(
        invitationId,
        organizationId,
        inviterUserId,
        inviteeEmail,
        inviteeUserId,
        role,
        'accepted',
        new Date(),
        new Date()
      );

      const pendingInvitation = new Invitation(
        InvitationId.generate(),
        organizationId,
        inviterUserId,
        'other@example.com',
        null,
        role,
        'pending',
        new Date(),
        null
      );

      // Then
      expect(acceptedInvitation.hasResponded()).toBe(true);
      expect(pendingInvitation.hasResponded()).toBe(false);
    });
  });
});

