// apps/web/src/domains/notification-management/backend/services/notification.service.ts

import { NotificationRepository } from '../repositories/interfaces/notification.repository.interface';
import { NotificationAggregate } from '../../shared/aggregates/notification.aggregate';
import {
  UserId,
  InvitationId,
  NotificationId,
} from '../../shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import {
  CreateInvitationNotificationCommand,
  MarkNotificationAsReadCommand,
  GetUserNotificationsCommand,
} from '../../shared/commands';
import { UserNotificationView, NotificationSummary } from '../../shared/dtos';
import { devLog, eventLog } from '@/utils/dev-logger';

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async createInvitationNotification(
    command: CreateInvitationNotificationCommand
  ): Promise<Result<NotificationAggregate, Error>> {
    try {
      const notification = NotificationAggregate.createInvitationNotification(
        new UserId(command.userId),
        new InvitationId(command.invitationId),
        command.organizationName,
        command.inviterName,
        command.role
      );

      await this.notificationRepository.save(notification);

      // 핵심 이벤트 로그 (Production: 10% 샘플링)
      eventLog('[NotificationService] Success', {
        notificationId: notification.id.value,
        userId: command.userId,
      });

      return Result.success(notification);
    } catch (error) {
      console.error('[NotificationService] Failed:', error);
      return Result.error(
        new Error('Failed to create invitation notification')
      );
    }
  }

  async markAsRead(
    command: MarkNotificationAsReadCommand
  ): Promise<Result<void, Error>> {
    try {
      const notification = await this.notificationRepository.findById(
        new NotificationId(command.notificationId)
      );

      if (!notification) {
        return Result.error(new Error('Notification not found'));
      }

      notification.markAsRead();
      await this.notificationRepository.save(notification);

      return Result.success(undefined);
    } catch (error) {
      return Result.error(new Error('Failed to mark notification as read'));
    }
  }

  async getUserNotifications(
    command: GetUserNotificationsCommand
  ): Promise<Result<UserNotificationView, Error>> {
    try {
      const notifications = await this.notificationRepository.findByUserId(
        new UserId(command.userId)
      );

      const unreadNotifications = notifications.filter(n => !n.isRead);

      const summaries: NotificationSummary[] = notifications.map(n => ({
        id: n.id.value,
        type: n.entity.type,
        title: n.entity.title,
        message: n.entity.message,
        relatedId: n.entity.relatedId,
        isRead: n.entity.isRead,
        createdAt: n.entity.createdAt.toISOString(),
        readAt: n.entity.readAt?.toISOString() || null,
      }));

      return Result.success({
        userId: command.userId,
        notifications: summaries,
        unreadCount: unreadNotifications.length,
      });
    } catch (error) {
      return Result.error(new Error('Failed to get user notifications'));
    }
  }
}
