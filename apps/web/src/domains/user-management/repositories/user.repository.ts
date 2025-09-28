import { UserAggregate } from '../aggregates/user.aggregate';
import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
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
    const result = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(
          eq(users.id, id.value),
          isNull(users.deletedAt)
        ))
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
    const result = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(
          eq(users.clerkId, clerkId),
          isNull(users.deletedAt)
        ))
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
    const result = await db.rls(async (tx) => {
      const rows = await tx
        .select()
        .from(users)
        .where(and(
          eq(users.email, email.value),
          isNull(users.deletedAt)
        ))
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
    await db.rls(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: userAggregate.id.value,
          clerkId: userAggregate.entity.clerkId,
          email: userAggregate.entity.email.value,
          firstName: userAggregate.entity.name.split(' ')[0] || null,
          lastName: userAggregate.entity.name.split(' ').slice(1).join(' ') || null,
          imageUrl: userAggregate.entity.avatarUrl,
          status: 'active',
          createdAt: userAggregate.entity.createdAt,
          updatedAt: userAggregate.entity.updatedAt,
          deletedAt: userAggregate.entity.deletedAt
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userAggregate.entity.email.value,
            firstName: userAggregate.entity.name.split(' ')[0] || null,
            lastName: userAggregate.entity.name.split(' ').slice(1).join(' ') || null,
            imageUrl: userAggregate.entity.avatarUrl,
            updatedAt: userAggregate.entity.updatedAt,
            deletedAt: userAggregate.entity.deletedAt
          }
        });
    });
  }

  async delete(id: UserId): Promise<void> {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async (tx) => {
      await tx
        .delete(users)
        .where(eq(users.id, id.value));
    });
  }

  async softDelete(id: UserId): Promise<void> {
    const db = await createClerkDrizzleSupabaseClient();
    await db.rls(async (tx) => {
      await tx
        .update(users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, id.value));
    });
  }

  private mapToAggregate(row: any): UserAggregate {
    const user = this.mapToUserEntity(row);
    return new UserAggregate(user, []);
  }

  private mapToUserEntity(row: any) {
    const { User } } = require('../entities/user.entity');
    const { UserId } = require('../value-objects/user-id.vo');
    const { UserEmail } = require('../value-objects/user-email.vo');

    return new User(
      new UserId(row.id),
      row.clerkId,
      new UserEmail(row.email),
      `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      row.imageUrl,
      row.createdAt,
      row.updatedAt,
      row.deletedAt
    );
  }
}