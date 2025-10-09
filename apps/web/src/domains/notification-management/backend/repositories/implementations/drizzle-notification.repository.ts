// apps/web/src/domains/notification-management/backend/repositories/implementations/drizzle-notification.repository.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { notifications } from '@/db/schema-dev';
import type { Notification as DBNotification } from '@/db/schema-dev';
import { NotificationRepository } from '../interfaces/notification.repository.interface';
import { NotificationAggregate } from '../../../shared/aggregates/notification.aggregate';
import { Notification } from '../../../shared/entities/notification.entity';
import { NotificationId, UserId } from '../../../shared/value-objects/ids.vo';

export class DrizzleNotificationRepository implements NotificationRepository {
  async save(notificationAggregate: NotificationAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // Notification 생성은 시스템 레벨 작업 (다른 사용자를 위한 알림 생성)
    // adminDb 사용하여 RLS 우회
    await db.admin
      .insert(notifications)
      .values({
        id: notificationAggregate.id.value,
        user_id: notificationAggregate.userId.value,
        type: notificationAggregate.entity.type,
        title: notificationAggregate.entity.title,
        message: notificationAggregate.entity.message,
        related_id: notificationAggregate.entity.relatedId,
        is_read: notificationAggregate.entity.isRead,
        created_at: notificationAggregate.entity.createdAt,
        read_at: notificationAggregate.entity.readAt,
      })
      .onConflictDoUpdate({
        target: notifications.id,
        set: {
          is_read: notificationAggregate.entity.isRead,
          read_at: notificationAggregate.entity.readAt,
        },
      });
  }

  async findById(id: NotificationId): Promise<NotificationAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.notifications.findFirst({
        where: eq(notifications.id, id.value),
      })
    );

    if (!data) {
      return null;
    }

    return this.mapToAggregate(data);
  }

  async findByUserId(userId: UserId): Promise<NotificationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.notifications.findMany({
        where: eq(notifications.user_id, userId.value),
        orderBy: (notificationsTable: typeof notifications, { desc }: any) => [
          desc(notificationsTable.created_at),
        ],
      })
    );

    return data.map((row: DBNotification) => this.mapToAggregate(row));
  }

  async findUnreadByUserId(userId: UserId): Promise<NotificationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.notifications.findMany({
        where: and(
          eq(notifications.user_id, userId.value),
          eq(notifications.is_read, false)
        ),
        orderBy: (notificationsTable: typeof notifications, { desc }: any) => [
          desc(notificationsTable.created_at),
        ],
      })
    );

    return data.map((row: DBNotification) => this.mapToAggregate(row));
  }

  async delete(id: NotificationId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx.delete(notifications).where(eq(notifications.id, id.value))
    );
  }

  private mapToAggregate(row: DBNotification): NotificationAggregate {
    const notification = new Notification(
      new NotificationId(row.id),
      new UserId(row.user_id),
      row.type,
      row.title,
      row.message,
      row.related_id,
      row.is_read,
      new Date(row.created_at),
      row.read_at ? new Date(row.read_at) : null
    );

    return new NotificationAggregate(notification);
  }
}
