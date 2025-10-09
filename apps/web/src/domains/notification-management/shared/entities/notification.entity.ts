// apps/web/src/domains/notification-management/shared/entities/notification.entity.ts

import { NotificationId, UserId } from '../value-objects/ids.vo';
import { NotificationType } from '../types';

export class Notification {
  constructor(
    public readonly id: NotificationId,
    public readonly userId: UserId,
    private _type: NotificationType,
    private _title: string,
    private _message: string,
    private _relatedId: string | null,
    private _isRead: boolean,
    public readonly createdAt: Date,
    private _readAt: Date | null
  ) {}

  // Getters
  get type(): NotificationType {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get relatedId(): string | null {
    return this._relatedId;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  // 상태 변경 메서드
  markAsRead(): void {
    if (!this._isRead) {
      this._isRead = true;
      this._readAt = new Date();
    }
  }
}
