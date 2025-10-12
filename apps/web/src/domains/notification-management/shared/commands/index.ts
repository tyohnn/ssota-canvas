// apps/web/src/domains/notification-management/shared/commands/index.ts

export interface CreateInvitationNotificationCommand {
  userId: string;
  invitationId: string;
  organizationName: string;
  inviterName: string;
  role: string;
}

export interface CreateWorkspaceInvitationNotificationCommand {
  userId: string;
  workspaceInvitationId: string;
  workspaceName: string;
  workspaceDescription: string | null;
  inviterName: string;
  organizationName: string;
}

export interface MarkNotificationAsReadCommand {
  notificationId: string;
  userId: string;
}

export interface GetUserNotificationsCommand {
  userId: string;
}
