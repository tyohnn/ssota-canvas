// apps/web/src/domains/notification-management/backend/repositories/interfaces/notification.repository.interface.ts

import { NotificationAggregate } from '../../../shared/aggregates/notification.aggregate';
import { NotificationId, UserId } from '../../../shared/value-objects/ids.vo';

export interface NotificationRepository {
  save(notification: NotificationAggregate): Promise<void>;
  findById(id: NotificationId): Promise<NotificationAggregate | null>;
  findByUserId(userId: UserId): Promise<NotificationAggregate[]>;
  findUnreadByUserId(userId: UserId): Promise<NotificationAggregate[]>;
  delete(id: NotificationId): Promise<void>;
}
