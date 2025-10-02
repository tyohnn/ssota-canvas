// apps/web/src/domains/user-management/repositories/implementations/drizzle-organization-context.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { organizationContexts } from '@/db/schema';
import { OrganizationContextRepository } from '../interfaces/organization-context.repository.interface';
import { OrganizationContextAggregate } from '../../aggregates/organization-context.aggregate';
import { OrganizationContext } from '../../entities/organization-context.entity';
import { UserId, OrganizationId } from '../../value-objects/ids.vo';

export class DrizzleOrganizationContextRepository
  implements OrganizationContextRepository
{
  async save(contextAggregate: OrganizationContextAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .insert(organizationContexts)
        .values({
          id: contextAggregate.id,
          userId: contextAggregate.userId.value,
          selectedOrganizationId: contextAggregate.selectedOrganizationId.value,
          selectedAt: contextAggregate.entity.selectedAt,
          createdAt: contextAggregate.entity.createdAt,
          updatedAt: contextAggregate.entity.updatedAt,
        })
        .onConflictDoUpdate({
          target: organizationContexts.userId,
          set: {
            selectedOrganizationId:
              contextAggregate.selectedOrganizationId.value,
            selectedAt: contextAggregate.entity.selectedAt,
            updatedAt: contextAggregate.entity.updatedAt,
          },
        })
    );
  }

  async findByUserId(
    userId: UserId
  ): Promise<OrganizationContextAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.organizationContexts.findFirst({
        where: eq(organizationContexts.userId, userId.value),
      })
    );

    if (!data) {
      return null;
    }

    const context = new OrganizationContext(
      data.id,
      new UserId(data.userId),
      new OrganizationId(data.selectedOrganizationId),
      new Date(data.selectedAt),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );

    return new OrganizationContextAggregate(context);
  }

  async deleteByUserId(userId: UserId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .delete(organizationContexts)
        .where(eq(organizationContexts.userId, userId.value))
    );
  }
}

