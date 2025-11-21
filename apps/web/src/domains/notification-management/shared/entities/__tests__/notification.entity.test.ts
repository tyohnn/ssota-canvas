import { describe, it, expect, beforeEach } from 'vitest';
import { Notification } from '../notification.entity.js';
import { NotificationId, UserId } from '../../value-objects/ids.vo.js';
import { NotificationType } from '../../types/index.js';

describe('Notification Entity', () => {
  let notificationId: NotificationId;
  let userId: UserId;
  let type: NotificationType;
  let title: string;
  let message: string;
  let relatedId: string;
  let createdAt: Date;

  beforeEach(() => {
    notificationId = NotificationId.generate();
    userId = new UserId(crypto.randomUUID());
    type = 'invitation';
    title = 'Test Notification';
    message = 'This is a test notification';
    relatedId = 'invitation-123';
    createdAt = new Date();
  });

  describe('생성자', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // When
      const notification = new Notification(
        notificationId,
        userId,
        type,
        title,
        message,
        relatedId,
        false,
        createdAt,
        null
      );

      // Then
      expect(notification.id).toBe(notificationId);
      expect(notification.userId).toBe(userId);
      expect(notification.type).toBe(type);
      expect(notification.title).toBe(title);
      expect(notification.message).toBe(message);
      expect(notification.relatedId).toBe(relatedId);
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBe(createdAt);
      expect(notification.readAt).toBeNull();
    });

    it('읽음 상태로 생성할 수 있어야 한다', () => {
      // Given
      const readAt = new Date();

      // When
      const notification = new Notification(
        notificationId,
        userId,
        type,
        title,
        message,
        relatedId,
        true,
        createdAt,
        readAt
      );

      // Then
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBe(readAt);
    });
  });

  describe('markAsRead', () => {
    it('읽지 않은 알림을 읽음 처리해야 한다', () => {
      // Given
      const notification = new Notification(
        notificationId,
        userId,
        type,
        title,
        message,
        relatedId,
        false,
        createdAt,
        null
      );

      // When
      notification.markAsRead();

      // Then
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('이미 읽은 알림은 readAt이 변경되지 않아야 한다', () => {
      // Given
      const originalReadAt = new Date('2024-01-01');
      const notification = new Notification(
        notificationId,
        userId,
        type,
        title,
        message,
        relatedId,
        true,
        createdAt,
        originalReadAt
      );

      // When
      notification.markAsRead();

      // Then
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBe(originalReadAt);
    });
  });

  describe('알림 타입', () => {
    it('invitation 타입으로 생성할 수 있어야 한다', () => {
      // When
      const notification = new Notification(
        notificationId,
        userId,
        'invitation',
        title,
        message,
        relatedId,
        false,
        createdAt,
        null
      );

      // Then
      expect(notification.type).toBe('invitation');
    });

    it('system 타입으로 생성할 수 있어야 한다', () => {
      // When
      const notification = new Notification(
        notificationId,
        userId,
        'system',
        title,
        message,
        null,
        false,
        createdAt,
        null
      );

      // Then
      expect(notification.type).toBe('system');
    });

    it('announcement 타입으로 생성할 수 있어야 한다', () => {
      // When
      const notification = new Notification(
        notificationId,
        userId,
        'announcement',
        title,
        message,
        null,
        false,
        createdAt,
        null
      );

      // Then
      expect(notification.type).toBe('announcement');
    });
  });
});

