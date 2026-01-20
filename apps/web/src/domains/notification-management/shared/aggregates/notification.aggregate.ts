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

  // Command 처리: 조직 초대 알림 생성
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
      `Invited to ${organizationName}`,
      `${inviterName} invited you to ${organizationName} organization as ${role}.`,
      invitationId.value,
      false,
      new Date(),
      null
    );

    return new NotificationAggregate(notification);
  }

  // Command 처리: Workspace 초대 알림 생성
  static createWorkspaceInvitationNotification(
    userId: UserId,
    workspaceInvitationId: string,
    workspaceName: string,
    workspaceDescription: string | null,
    inviterName: string,
    organizationName: string
  ): NotificationAggregate {
    const descriptionText = workspaceDescription
      ? ` - ${workspaceDescription}`
      : '';

    const notification = new Notification(
      NotificationId.generate(),
      userId,
      'workspace-invitation',
      `Invited to ${workspaceName} workspace`,
      `${inviterName} invited you to ${workspaceName} workspace in ${organizationName} organization${descriptionText}`,
      workspaceInvitationId,
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
