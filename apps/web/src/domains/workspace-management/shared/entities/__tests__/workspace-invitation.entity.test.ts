import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceInvitation } from '../workspace-invitation.entity';
import { WorkspaceInvitationId } from '../../value-objects/workspace-invitation-id.vo';
import { WorkspaceId } from '../../value-objects/workspace-id.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('WorkspaceInvitation Entity', () => {
  let invitationId: WorkspaceInvitationId;
  let workspaceId: WorkspaceId;
  const invitedUserId = 'user-123';
  const invitedBy = 'admin-456';

  beforeEach(() => {
    invitationId = new WorkspaceInvitationId(
      '550e8400-e29b-41d4-a716-446655440000'
    );
    workspaceId = new WorkspaceId('660e8400-e29b-41d4-a716-446655440000');
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const createdAt = new Date();

      // When
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        createdAt,
        null
      );

      // Then
      expect(invitation.id).toBe(invitationId);
      expect(invitation.workspaceId).toBe(workspaceId);
      expect(invitation.invitedUserId).toBe(invitedUserId);
      expect(invitation.invitedBy).toBe(invitedBy);
      expect(invitation.status).toBe('pending');
      expect(invitation.notificationId).toBeNull();
      expect(invitation.createdAt).toBe(createdAt);
      expect(invitation.processedAt).toBeNull();
    });

    it('기본 상태는 pending이어야 한다', () => {
      // Given
      const createdAt = new Date();

      // When
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        createdAt,
        null
      );

      // Then
      expect(invitation.status).toBe('pending');
      expect(invitation.isPending()).toBe(true);
      expect(invitation.isAccepted()).toBe(false);
      expect(invitation.isRejected()).toBe(false);
    });
  });

  describe('accept', () => {
    it('초대를 수락하면 상태가 accepted로 변경되어야 한다', () => {
      // Given
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        new Date(),
        null
      );

      // When
      invitation.accept();

      // Then
      expect(invitation.status).toBe('accepted');
      expect(invitation.isAccepted()).toBe(true);
      expect(invitation.isPending()).toBe(false);
      expect(invitation.processedAt).toBeInstanceOf(Date);
    });

    it('이미 처리된 초대는 수락할 수 없다', () => {
      // Given
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'accepted',
        null,
        new Date(),
        new Date()
      );

      // When & Then
      expect(() => invitation.accept()).toThrow(WorkspaceManagementError);
      expect(() => invitation.accept()).toThrow(
        '이미 처리된 초대입니다'
      );
    });
  });

  describe('reject', () => {
    it('초대를 거절하면 상태가 rejected로 변경되어야 한다', () => {
      // Given
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        new Date(),
        null
      );

      // When
      invitation.reject();

      // Then
      expect(invitation.status).toBe('rejected');
      expect(invitation.isRejected()).toBe(true);
      expect(invitation.isPending()).toBe(false);
      expect(invitation.processedAt).toBeInstanceOf(Date);
    });

    it('이미 처리된 초대는 거절할 수 없다', () => {
      // Given
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'rejected',
        null,
        new Date(),
        new Date()
      );

      // When & Then
      expect(() => invitation.reject()).toThrow(WorkspaceManagementError);
      expect(() => invitation.reject()).toThrow(
        '이미 처리된 초대입니다'
      );
    });
  });

  describe('상태 확인 메서드', () => {
    it('isPending: pending 상태 확인', () => {
      const pending = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        new Date(),
        null
      );

      expect(pending.isPending()).toBe(true);
    });

    it('isAccepted: accepted 상태 확인', () => {
      const accepted = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'accepted',
        null,
        new Date(),
        new Date()
      );

      expect(accepted.isAccepted()).toBe(true);
    });

    it('isRejected: rejected 상태 확인', () => {
      const rejected = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'rejected',
        null,
        new Date(),
        new Date()
      );

      expect(rejected.isRejected()).toBe(true);
    });

    it('canBeProcessed: pending 상태만 처리 가능', () => {
      const pending = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        new Date(),
        null
      );

      const accepted = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'accepted',
        null,
        new Date(),
        new Date()
      );

      expect(pending.canBeProcessed()).toBe(true);
      expect(accepted.canBeProcessed()).toBe(false);
    });
  });

  describe('setNotificationId', () => {
    it('알림 ID를 설정할 수 있어야 한다', () => {
      // Given
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        invitedUserId,
        invitedBy,
        'pending',
        null,
        new Date(),
        null
      );
      const notificationId = '770e8400-e29b-41d4-a716-446655440000';

      // When
      invitation.setNotificationId(notificationId);

      // Then
      expect(invitation.notificationId).toBe(notificationId);
    });
  });
});

