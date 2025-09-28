import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export class UserCreatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class ClerkUserSyncedEvent {
  constructor(
    public readonly userId: string,
    public readonly clerkId: string,
    public readonly email: string,
    public readonly status: 'active' | 'soft_deleted' | 'permanently_deleted',
    public readonly timestamp: Date = new Date()
  ) {}
}