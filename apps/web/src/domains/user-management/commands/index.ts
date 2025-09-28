import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export interface SyncClerkUserCommand {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted';
  metadata?: Record<string, any>;
  webhookType: 'user.created' | 'user.updated' | 'user.deleted';
}

export interface CreateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface UpdateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
