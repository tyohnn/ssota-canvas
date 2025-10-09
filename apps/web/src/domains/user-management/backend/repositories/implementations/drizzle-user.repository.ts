// apps/web/src/domains/user-management/repositories/implementations/drizzle-user.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles } from '@/db/schema-dev';
import { UserRepository } from '../interfaces/user.repository.interface';
import { UserAggregate } from '../../../shared/aggregates/user.aggregate';
import { User } from '../../../shared/entities/user.entity';
import { UserId } from '../../../shared/value-objects/ids.vo';
import { UserEmail } from '../../../shared/value-objects/user-email.vo';

export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<UserAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.user_id, id.value),
      })
    );

    if (!data) {
      return null;
    }

    // schema-dev.ts 구조: name, avatar_url 사용
    const user = new User(
      new UserId(data.user_id),
      new UserEmail(data.email),
      data.name || 'User',
      data.avatar_url,
      new Date(data.created_at),
      new Date(data.updated_at)
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

    // schema-dev.ts 구조: name, avatar_url 사용
    const user = new User(
      new UserId(data.user_id),
      new UserEmail(data.email),
      data.name || 'User',
      data.avatar_url,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    return new UserAggregate(user);
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // schema-dev.ts를 SSOT로 사용: name, avatar_url 컬럼
    const profileData = {
      user_id: userAggregate.id.value,
      email: userAggregate.entity.email.value,
      name: userAggregate.entity.name,
      avatar_url: userAggregate.entity.avatarUrl,
      created_at: userAggregate.entity.createdAt,
      updated_at: userAggregate.entity.updatedAt,
    };

    try {
      await db.rls(tx =>
        tx
          .insert(profiles)
          .values(profileData)
          .onConflictDoUpdate({
            target: profiles.user_id,
            set: {
              email: userAggregate.entity.email.value,
              name: userAggregate.entity.name,
              avatar_url: userAggregate.entity.avatarUrl,
              updated_at: userAggregate.entity.updatedAt,
            },
          })
      );
    } catch (error) {
      throw error;
    }
  }

  async delete(id: UserId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx.delete(profiles).where(eq(profiles.user_id, id.value))
    );
  }
}
