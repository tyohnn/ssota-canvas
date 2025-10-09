// apps/web/src/domains/notification-management/shared/aggregates/notification.aggregate.ts

import { Notification } from '../entities/notification.entity';
import {
  NotificationId,
  UserId,
  InvitationId,
  OrganizationId,
} from '../value-objects/ids.vo';
import { NotificationType } from '../types';

export class NotificationAggregate {
  constructor(private notification: Notification) {}

  // Command 처리: 초대 알림 생성
  static createInvitationNotification(
    userId: UserId,
    invitationId: InvitationId,
    organizationName: string,
    inviterName: string,
    role: string
  ): NotificationAggregate {
    const notification = new Notification(
      NotificationId.generate(),
      userId,
      'invitation',
      `${organizationName}에 초대되었습니다`,
      `${inviterName}님이 ${organizationName} 조직에 ${role} 역할로 초대했습니다.`,
      invitationId.value,
      false,
      new Date(),
      null
    );

    return new NotificationAggregate(notification);
  }

  // Command 처리: 읽음 처리
  markAsRead(): void {
    this.notification.markAsRead();
  }

  // Getters
  get id(): NotificationId {
    return this.notification.id;
  }

  get entity(): Notification {
    return this.notification;
  }

  get userId(): UserId {
    return this.notification.userId;
  }

  get isRead(): boolean {
    return this.notification.isRead;
  }
}
