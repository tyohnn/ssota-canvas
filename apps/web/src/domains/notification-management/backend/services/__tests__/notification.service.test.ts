import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../notification.service.js';
import { NotificationRepository } from '../../repositories/interfaces/notification.repository.interface.js';
import { NotificationAggregate } from '../../../shared/aggregates/notification.aggregate.js';
import { UserId, InvitationId, NotificationId } from '../../../shared/value-objects/ids.vo.js';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: NotificationRepository;

  beforeEach(() => {
    // Mock Repository
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findUnreadByUserId: vi.fn(),
      findByRelatedId: vi.fn(),
      delete: vi.fn(),
    };

    service = new NotificationService(mockRepository);
  });

  describe('createInvitationNotification', () => {
    it('초대 알림을 생성하고 저장해야 한다', async () => {
      // Given
      const command = {
        userId: crypto.randomUUID(),
        invitationId: crypto.randomUUID(),
        organizationName: 'Test Organization',
        inviterName: 'John Doe',
        role: 'admin',
      };

      // When
      const result = await service.createInvitationNotification(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(NotificationAggregate)
      );
    });

    it('생성된 알림이 올바른 정보를 포함해야 한다', async () => {
      // Given
      const command = {
        userId: crypto.randomUUID(),
        invitationId: crypto.randomUUID(),
        organizationName: 'XBowl 팀',
        inviterName: '김철수',
        role: 'member',
      };

      // When
      const result = await service.createInvitationNotification(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      const notification = result.value;
      expect(notification.entity.title).toContain('XBowl 팀');
      expect(notification.entity.message).toContain('김철수');
      expect(notification.entity.type).toBe('invitation');
    });

    it('저장 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        userId: crypto.randomUUID(),
        invitationId: crypto.randomUUID(),
        organizationName: 'Test Organization',
        inviterName: 'John Doe',
        role: 'admin',
      };

      vi.mocked(mockRepository.save).mockRejectedValueOnce(
        new Error('Database error')
      );

      // When
      const result = await service.createInvitationNotification(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('Failed to create invitation notification');
    });
  });

  describe('markAsRead', () => {
    it('알림을 읽음 처리해야 한다', async () => {
      // Given
      const notificationId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const command = {
        notificationId,
        userId,
      };

      const mockAggregate = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Test Org',
        'John',
        'admin'
      );

      vi.mocked(mockRepository.findById).mockResolvedValueOnce(mockAggregate);

      // When
      const result = await service.markAsRead(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.any(NotificationId)
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 알림은 에러를 반환해야 한다', async () => {
      // Given
      const command = {
        notificationId: crypto.randomUUID(),
        userId: crypto.randomUUID(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);

      // When
      const result = await service.markAsRead(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toBe('Notification not found');
    });
  });

  describe('getUserNotifications', () => {
    it('사용자의 알림 목록을 조회해야 한다', async () => {
      // Given
      const userId = crypto.randomUUID();
      const command = { userId };

      const notification1 = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Org 1',
        'John',
        'admin'
      );

      const notification2 = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Org 2',
        'Jane',
        'member'
      );

      vi.mocked(mockRepository.findByUserId).mockResolvedValueOnce([
        notification1,
        notification2,
      ]);

      // When
      const result = await service.getUserNotifications(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.notifications).toHaveLength(2);
      expect(result.value.unreadCount).toBe(2);
    });

    it('읽지 않은 알림 개수를 올바르게 계산해야 한다', async () => {
      // Given
      const userId = crypto.randomUUID();
      const command = { userId };

      const notification1 = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Org 1',
        'John',
        'admin'
      );

      const notification2 = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Org 2',
        'Jane',
        'member'
      );

      // notification2를 읽음 처리
      notification2.markAsRead();

      vi.mocked(mockRepository.findByUserId).mockResolvedValueOnce([
        notification1,
        notification2,
      ]);

      // When
      const result = await service.getUserNotifications(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.notifications).toHaveLength(2);
      expect(result.value.unreadCount).toBe(1); // 하나만 읽지 않음
    });

    it('알림 DTO가 올바르게 직렬화되어야 한다', async () => {
      // Given
      const userId = crypto.randomUUID();
      const command = { userId };

      const notification = NotificationAggregate.createInvitationNotification(
        new UserId(userId),
        InvitationId.generate(),
        'Test Org',
        'John',
        'admin'
      );

      vi.mocked(mockRepository.findByUserId).mockResolvedValueOnce([
        notification,
      ]);

      // When
      const result = await service.getUserNotifications(command);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.notifications).toHaveLength(1);
      const dto = result.value.notifications[0];
      expect(dto).toBeDefined();
      expect(typeof dto!.id).toBe('string');
      expect(typeof dto!.createdAt).toBe('string'); // ISO string
      expect(dto!.type).toBe('invitation');
      expect(dto!.isRead).toBe(false);
    });

    it('조회 실패 시 에러를 반환해야 한다', async () => {
      // Given
      const command = { userId: crypto.randomUUID() };

      vi.mocked(mockRepository.findByUserId).mockRejectedValueOnce(
        new Error('Database error')
      );

      // When
      const result = await service.getUserNotifications(command);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.message).toContain('Failed to get user notifications');
    });
  });
});

