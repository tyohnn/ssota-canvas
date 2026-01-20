import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationAggregate } from '../notification.aggregate.js';
import { NotificationId, UserId, InvitationId } from '../../value-objects/ids.vo.js';

describe('NotificationAggregate', () => {
  let userId: UserId;
  let invitationId: InvitationId;
  let organizationName: string;
  let inviterName: string;
  let role: string;

  beforeEach(() => {
    userId = new UserId(crypto.randomUUID());
    invitationId = InvitationId.generate();
    organizationName = 'Test Organization';
    inviterName = 'John Doe';
    role = 'admin';
  });

  describe('createInvitationNotification', () => {
    it('초대 알림을 생성해야 한다', () => {
      // When
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // Then
      expect(aggregate.entity.userId).toBe(userId);
      expect(aggregate.entity.type).toBe('invitation');
      expect(aggregate.entity.title).toContain(organizationName);
      expect(aggregate.entity.message).toContain(inviterName);
      expect(aggregate.entity.message).toContain(organizationName);
      expect(aggregate.entity.message).toContain(role);
      expect(aggregate.entity.relatedId).toBe(invitationId.value);
      expect(aggregate.entity.isRead).toBe(false);
      expect(aggregate.entity.readAt).toBeNull();
    });

    it('생성된 알림의 ID가 유효해야 한다', () => {
      // When
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // Then
      expect(aggregate.id).toBeInstanceOf(NotificationId);
      expect(aggregate.id.value).toBeTruthy();
    });

    it('생성 시각이 현재 시각이어야 한다', () => {
      // Given
      const beforeCreation = new Date();

      // When
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // Then
      const afterCreation = new Date();
      expect(aggregate.entity.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(aggregate.entity.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
    });
  });

  describe('markAsRead', () => {
    it('알림을 읽음 처리해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );
      expect(aggregate.isRead).toBe(false);

      // When
      aggregate.markAsRead();

      // Then
      expect(aggregate.isRead).toBe(true);
      expect(aggregate.entity.readAt).toBeInstanceOf(Date);
    });

    it('이미 읽은 알림도 호출 가능해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );
      aggregate.markAsRead();
      const firstReadAt = aggregate.entity.readAt;

      // When
      aggregate.markAsRead();

      // Then
      expect(aggregate.isRead).toBe(true);
      expect(aggregate.entity.readAt).toBe(firstReadAt);
    });
  });

  describe('Getters', () => {
    it('id getter가 올바른 NotificationId를 반환해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // When
      const id = aggregate.id;

      // Then
      expect(id).toBeInstanceOf(NotificationId);
      expect(id).toBe(aggregate.entity.id);
    });

    it('userId getter가 올바른 UserId를 반환해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // When
      const returnedUserId = aggregate.userId;

      // Then
      expect(returnedUserId).toBe(userId);
      expect(returnedUserId).toBe(aggregate.entity.userId);
    });

    it('isRead getter가 올바른 읽음 상태를 반환해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // When & Then (읽기 전)
      expect(aggregate.isRead).toBe(false);

      // When (읽음 처리)
      aggregate.markAsRead();

      // Then (읽은 후)
      expect(aggregate.isRead).toBe(true);
    });

    it('entity getter가 Notification 엔티티를 반환해야 한다', () => {
      // Given
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        organizationName,
        inviterName,
        role
      );

      // When
      const entity = aggregate.entity;

      // Then
      expect(entity).toBeDefined();
      expect(entity.id).toBeInstanceOf(NotificationId);
      expect(entity.userId).toBe(userId);
    });
  });

  describe('알림 메시지 포맷', () => {
    it('영어 메시지 형식이 올바르게 생성되어야 한다', () => {
      // When
      const aggregate = NotificationAggregate.createInvitationNotification(
        userId,
        invitationId,
        'XBowl Team',
        'John Doe',
        'member'
      );

      // Then
      expect(aggregate.entity.title).toBe('Invited to XBowl Team');
      expect(aggregate.entity.message).toBe(
        'John Doe invited you to XBowl Team organization as member.'
      );
    });
  });
});

