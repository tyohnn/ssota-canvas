// apps/web/src/domains/user-management/aggregates/user.aggregate.ts

import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserProfileCreatedEvent, UserUpdatedEvent } from '../events';

export class UserAggregate {
  constructor(private user: User) {}

  // Command 처리
  static createFromSupabaseAuth(supabaseUser: SupabaseUser): UserAggregate {
    const user = new User(
      new UserId(supabaseUser.id),
      new UserEmail(supabaseUser.email!),
      supabaseUser.user_metadata?.name || 'User',
      supabaseUser.user_metadata?.avatar_url || null,
      new Date(supabaseUser.created_at),
      new Date()
    );
    return new UserAggregate(user);
  }

  updateFromSupabaseAuth(supabaseUser: SupabaseUser): UserUpdatedEvent {
    const newEmail = new UserEmail(supabaseUser.email!);
    const newName = supabaseUser.user_metadata?.name || 'User';

    const hasChanges =
      !this.user.email.equals(newEmail) ||
      this.user.name !== newName ||
      this.user.avatarUrl !== (supabaseUser.user_metadata?.avatar_url || null);

    if (hasChanges) {
      this.user.updateProfile(
        newName,
        supabaseUser.user_metadata?.avatar_url || null
      );
      if (!this.user.email.equals(newEmail)) {
        this.user.updateEmail(newEmail);
      }
    }

    return new UserUpdatedEvent(this.user.id, this.user.email, this.user.name);
  }

  // Getters
  get id(): UserId {
    return this.user.id;
  }

  get entity(): User {
    return this.user;
  }
}
