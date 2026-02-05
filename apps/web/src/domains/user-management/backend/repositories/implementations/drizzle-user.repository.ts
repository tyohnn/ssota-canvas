// apps/web/src/domains/user-management/repositories/implementations/drizzle-user.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import { profiles } from '@/db/schema';
import { UserRepository } from '../interfaces/user.repository.interface';
import { UserAggregate } from '../../../shared/aggregates/user.aggregate';
import { User } from '../../../shared/entities/user.entity';
import { UserId } from '../../../shared/value-objects/ids.vo';
import { UserEmail } from '../../../shared/value-objects/user-email.vo';
import { UserProfile } from '../../../shared/types';

export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<UserAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, id.value),
      })
    );

    if (!data) {
      return null;
    }

    // schema.ts 구조: name, avatar_url, language, beta fields (optional)
    const user = new User(
      new UserId(data.id),
      new UserEmail(data.email),
      data.name || 'User',
      data.avatar_url,
      data.language || 'en',
      new Date(data.created_at),
      new Date(data.updated_at),
      data.beta_status,
      data.beta_application
    );

    return new UserAggregate(user);
  }

  async findByEmail(email: UserEmail): Promise<UserAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.email, email.value),
      })
    );

    if (!data) {
      return null;
    }

    // schema.ts 구조: name, avatar_url, language, beta fields (optional)
    const user = new User(
      new UserId(data.id),
      new UserEmail(data.email),
      data.name || 'User',
      data.avatar_url,
      data.language || 'en',
      new Date(data.created_at),
      new Date(data.updated_at),
      data.beta_status,
      data.beta_application
    );

    return new UserAggregate(user);
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    // schema.ts를 SSOT로 사용: name, avatar_url, language 컬럼
    const profileData = {
      id: userAggregate.id.value,
      email: userAggregate.entity.email.value,
      name: userAggregate.entity.name,
      avatar_url: userAggregate.entity.avatarUrl,
      language: userAggregate.entity.language,
      created_at: userAggregate.entity.createdAt,
      updated_at: userAggregate.entity.updatedAt,
    };

    try {
      await adminDb
        .insert(profiles)
        .values(profileData)
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            email: userAggregate.entity.email.value,
            name: userAggregate.entity.name,
            avatar_url: userAggregate.entity.avatarUrl,
            language: userAggregate.entity.language,
            updated_at: userAggregate.entity.updatedAt,
          },
        });
    } catch (error) {
      throw error;
    }
  }

  async delete(id: UserId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx => tx.delete(profiles).where(eq(profiles.id, id.value)));
  }

  /**
   * 사용자 프로필 조회 (CreatedByProfile 형태로 반환)
   */
  async getUserProfile(userId: UserId): Promise<UserProfile | undefined> {
    try {
      const result = await adminDb
        .select({
          id: profiles.id,
          email: profiles.email,
          name: profiles.name,
          avatar_url: profiles.avatar_url,
        })
        .from(profiles)
        .where(eq(profiles.id, userId.value))
        .limit(1);

      if (result.length === 0) return undefined;

      const profile = result[0];
      if (!profile) return undefined;
      return {
        userId: profile.id,
        email: profile.email,
        name: profile.name || '',
        profileImageUrl: profile.avatar_url || null,
      };
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return undefined;
    }
  }
}
