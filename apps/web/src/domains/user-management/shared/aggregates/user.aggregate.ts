// apps/web/src/domains/user-management/aggregates/user.aggregate.ts

import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserProfileCreatedEvent, UserUpdatedEvent } from '../events';
import type { AuthUserInfo } from '../types';

export class UserAggregate {
  constructor(private user: User) {}

  /**
   * Create aggregate from auth user info (DomainUser or equivalent).
   * Use this when the caller has already normalized auth data (e.g. from ACL).
   */
  static createFromAuthUserInfo(
    authUser: AuthUserInfo,
    language: string = 'en'
  ): UserAggregate {
    const user = new User(
      new UserId(authUser.id),
      new UserEmail(authUser.email),
      authUser.name || 'User',
      authUser.avatarUrl ?? null,
      language,
      authUser.createdAt,
      new Date()
    );
    return new UserAggregate(user);
  }

  /**
   * Update aggregate from auth user info.
   */
  updateFromAuthUserInfo(
    authUser: AuthUserInfo,
    language?: string
  ): UserUpdatedEvent {
    const newEmail = new UserEmail(authUser.email);
    const newName = authUser.name || 'User';

    const hasChanges =
      !this.user.email.equals(newEmail) ||
      this.user.name !== newName ||
      this.user.avatarUrl !== (authUser.avatarUrl ?? null) ||
      (language !== undefined && this.user.language !== language);

    if (hasChanges) {
      this.user.updateProfile(
        newName,
        authUser.avatarUrl ?? null,
        language
      );
      if (!this.user.email.equals(newEmail)) {
        this.user.updateEmail(newEmail);
      }
    }

    return new UserUpdatedEvent(this.user.id, this.user.email, this.user.name);
  }

  // Legacy: Supabase User (for callers that have the raw Supabase object)
  static createFromSupabaseAuth(
    supabaseUser: SupabaseUser,
    language: string = 'en'
  ): UserAggregate {
    return this.createFromAuthUserInfo(
      {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        name: supabaseUser.user_metadata?.name ?? 'User',
        avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
        createdAt: new Date(supabaseUser.created_at),
      },
      language
    );
  }

  updateFromSupabaseAuth(
    supabaseUser: SupabaseUser,
    language?: string
  ): UserUpdatedEvent {
    return this.updateFromAuthUserInfo(
      {
        id: supabaseUser.id,
        email: supabaseUser.email ?? '',
        name: supabaseUser.user_metadata?.name ?? 'User',
        avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
        createdAt: new Date(supabaseUser.created_at),
      },
      language
    );
  }

  // Getters
  get id(): UserId {
    return this.user.id;
  }

  get entity(): User {
    return this.user;
  }
}
