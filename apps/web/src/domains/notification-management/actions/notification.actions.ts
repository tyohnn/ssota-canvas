// apps/web/src/domains/notification-management/actions/notification.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { DrizzleNotificationRepository } from '../backend/repositories/implementations/drizzle-notification.repository';
import { NotificationService } from '../backend/services/notification.service';
import {
  CreateInvitationNotificationCommand,
  CreateWorkspaceInvitationNotificationCommand,
  MarkNotificationAsReadCommand,
  GetUserNotificationsCommand,
} from '../shared/commands';
import {
  UserNotificationView,
  CreateInvitationNotificationRequest,
  CreateWorkspaceInvitationNotificationRequest,
} from '../shared/dtos';

export async function createInvitationNotificationAction(
  input: CreateInvitationNotificationRequest
): Promise<void> {
  try {
    const repository = new DrizzleNotificationRepository();
    const service = new NotificationService(repository);

    const command: CreateInvitationNotificationCommand = {
      userId: input.userId,
      invitationId: input.invitationId,
      organizationName: input.organizationName,
      inviterName: input.inviterName,
      role: input.role,
    };

    const result = await service.createInvitationNotification(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/notifications');
  } catch (error) {
    throw error;
  }
}

export async function createWorkspaceInvitationNotificationAction(
  input: CreateWorkspaceInvitationNotificationRequest
): Promise<void> {
  try {
    const repository = new DrizzleNotificationRepository();
    const service = new NotificationService(repository);

    const command: CreateWorkspaceInvitationNotificationCommand = {
      userId: input.userId,
      workspaceInvitationId: input.workspaceInvitationId,
      workspaceName: input.workspaceName,
      workspaceDescription: input.workspaceDescription,
      inviterName: input.inviterName,
      organizationName: input.organizationName,
    };

    const result = await service.createWorkspaceInvitationNotification(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/notifications');
  } catch (error) {
    throw error;
  }
}

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    const repository = new DrizzleNotificationRepository();
    const service = new NotificationService(repository);

    const command: MarkNotificationAsReadCommand = {
      notificationId,
      userId: user.id,
    };

    const result = await service.markAsRead(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    revalidatePath('/notifications');
  } catch (error) {
    throw error;
  }
}

export async function getUserNotificationsAction(): Promise<UserNotificationView> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    const repository = new DrizzleNotificationRepository();
    const service = new NotificationService(repository);

    const command: GetUserNotificationsCommand = {
      userId: user.id,
    };

    const result = await service.getUserNotifications(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    return result.value;
  } catch (error) {
    throw error;
  }
}
