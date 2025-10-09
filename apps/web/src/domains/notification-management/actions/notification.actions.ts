// apps/web/src/domains/notification-management/actions/notification.actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { DrizzleNotificationRepository } from '../backend/repositories/implementations/drizzle-notification.repository';
import { NotificationService } from '../backend/services/notification.service';
import {
  CreateInvitationNotificationCommand,
  MarkNotificationAsReadCommand,
  GetUserNotificationsCommand,
} from '../shared/commands';
import {
  UserNotificationView,
  CreateInvitationNotificationRequest,
} from '../shared/dtos';

/**
 * Create an invitation notification for a user and revalidate related cache paths.
 *
 * @param input - Payload containing `userId`, `invitationId`, `organizationName`, `inviterName`, and `role`
 * @throws Error when the notification service reports a failure; the error message contains the failure reason
 */
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

/**
 * Marks a notification as read for the currently authenticated user.
 *
 * @param notificationId - The ID of the notification to mark as read
 * @throws Error - If the request is unauthenticated (message: "Authentication required")
 * @throws Error - If the notification cannot be marked as read (service-provided error message)
 */
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

/**
 * Retrieves the authenticated user's notifications.
 *
 * @returns The user's notifications as a `UserNotificationView`.
 * @throws Error when authentication fails ("Authentication required") or when the notification service returns an error.
 */
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