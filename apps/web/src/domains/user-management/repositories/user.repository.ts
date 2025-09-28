import { UserAggregate } from '../aggregates/user.aggregate';
import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { User } from '../entities/user.entity';
import { createClerkDrizzleSupabaseClient } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  findByClerkId(clerkId: string): Promise<UserAggregate | null>;
  findByEmail(email: UserEmail): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<void>;
  delete(id: UserId): Promise<void>;
  softDelete(id: UserId): Promise<void>;
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<UserAggregate | null> {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, id.value), isNull(users.deleted_at)))
        .limit(1);

      return rows;
    });

    if (result.length === 0) {
      return null;
    }

    return this.mapToAggregate(result[0]);
  }

  async findByClerkId(clerkId: string): Promise<UserAggregate | null> {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(eq(users.clerk_id, clerkId), isNull(users.deleted_at)))
        .limit(1);

      return rows;
    });

    if (result.length === 0) {
      return null;
    }

    return this.mapToAggregate(result[0]);
  }

  async findByEmail(email: UserEmail): Promise<UserAggregate | null> {
    const db = await createClerkDrizzleSupabaseClient();
    const result = await db.rls(async tx => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(eq(users.email, email.value), isNull(users.deleted_at)))
        .limit(1);

      return rows;
    });

    if (result.length === 0) {
      return null;
    }

    return this.mapToAggregate(result[0]);
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async tx => {
      await tx
        .insert(users)
        .values({
          id: userAggregate.id.value,
          clerk_id: userAggregate.entity.clerkId,
          email: userAggregate.entity.email.value,
          first_name: userAggregate.entity.name.split(' ')[0] || null,
          last_name:
            userAggregate.entity.name.split(' ').slice(1).join(' ') || null,
          image_url: userAggregate.entity.avatarUrl,
          status: 'active',
          created_at: userAggregate.entity.createdAt,
          updated_at: userAggregate.entity.updatedAt,
          deleted_at: userAggregate.entity.deletedAt,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userAggregate.entity.email.value,
            first_name: userAggregate.entity.name.split(' ')[0] || null,
            last_name:
              userAggregate.entity.name.split(' ').slice(1).join(' ') || null,
            image_url: userAggregate.entity.avatarUrl,
            updated_at: userAggregate.entity.updatedAt,
            deleted_at: userAggregate.entity.deletedAt,
          },
        });
    });
  }

  async delete(id: UserId): Promise<void> {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async tx => {
      await tx.delete(users).where(eq(users.id, id.value));
    });
  }

  async softDelete(id: UserId): Promise<void> {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async tx => {
      await tx
        .update(users)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(users.id, id.value));
    });
  }

  private mapToAggregate(row: any): UserAggregate {
    const user = this.mapToUserEntity(row);
    return new UserAggregate(user, []);
  }

  private mapToUserEntity(row: any): User {
    return new User(
      new UserId(row.id),
      row.clerk_id,
      new UserEmail(row.email),
      `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      row.image_url,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
}
