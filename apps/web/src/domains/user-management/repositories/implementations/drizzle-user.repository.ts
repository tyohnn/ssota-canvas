// apps/web/src/domains/user-management/repositories/implementations/drizzle-user.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles } from '@/db/schema';
import { UserRepository } from '../interfaces/user.repository.interface';
import { UserAggregate } from '../../aggregates/user.aggregate';
import { User } from '../../entities/user.entity';
import { UserId } from '../../value-objects/ids.vo';
import { UserEmail } from '../../value-objects/user-email.vo';

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

    const user = new User(
      new UserId(data.user_id),
      new UserEmail(data.email),
      [data.first_name, data.last_name].filter(Boolean).join(' ') || 'User',
      data.image_url,
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

    const user = new User(
      new UserId(data.user_id),
      new UserEmail(data.email),
      [data.first_name, data.last_name].filter(Boolean).join(' ') || 'User',
      data.image_url,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    return new UserAggregate(user);
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    const nameParts = userAggregate.entity.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || null;

    await db.rls(tx =>
      tx
        .insert(profiles)
        .values({
          user_id: userAggregate.id.value,
          email: userAggregate.entity.email.value,
          first_name: firstName,
          last_name: lastName,
          image_url: userAggregate.entity.avatarUrl,
          created_at: userAggregate.entity.createdAt,
          updated_at: userAggregate.entity.updatedAt,
        })
        .onConflictDoUpdate({
          target: profiles.user_id,
          set: {
            email: userAggregate.entity.email.value,
            first_name: firstName,
            last_name: lastName,
            image_url: userAggregate.entity.avatarUrl,
            updated_at: userAggregate.entity.updatedAt,
          },
        })
    );
  }

  async delete(id: UserId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx.delete(profiles).where(eq(profiles.user_id, id.value))
    );
  }
}
