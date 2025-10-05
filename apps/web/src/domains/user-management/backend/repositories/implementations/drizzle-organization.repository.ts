// apps/web/src/domains/user-management/repositories/implementations/drizzle-organization.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { organizations } from '@/db/schema-dev';
import type { Organization as DBOrganization } from '@/db/schema-dev';
import { OrganizationRepository } from '../interfaces/organization.repository.interface';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate';
import { Organization } from '../../../shared/entities/organization.entity';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';

export class DrizzleOrganizationRepository implements OrganizationRepository {
  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.organizations.findFirst({
        where: eq(organizations.id, id.value),
      })
    );

    if (!data) {
      return null;
    }

    const organization = new Organization(
      new OrganizationId(data.id),
      data.name,
      new UserId(data.owner_id),
      data.is_default ?? false,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    return new OrganizationAggregate(organization);
  }

  async findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.organizations.findMany({
        where: eq(organizations.owner_id, ownerId.value),
        orderBy: (orgs: typeof organizations, { asc }: any) => [
          asc(orgs.created_at),
        ],
      })
    );

    return data.map((row: DBOrganization) => {
      const organization = new Organization(
        new OrganizationId(row.id),
        row.name,
        new UserId(row.owner_id),
        row.is_default ?? false,
        new Date(row.created_at),
        new Date(row.updated_at)
      );

      return new OrganizationAggregate(organization);
    });
  }

  async save(organizationAggregate: OrganizationAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx
        .insert(organizations)
        .values({
          id: organizationAggregate.id.value,
          name: organizationAggregate.entity.name,
          owner_id: organizationAggregate.entity.ownerId.value,
          is_default: organizationAggregate.entity.isDefault,
          created_at: organizationAggregate.entity.createdAt,
          updated_at: organizationAggregate.entity.updatedAt,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: organizationAggregate.entity.name,
            is_default: organizationAggregate.entity.isDefault,
            updated_at: organizationAggregate.entity.updatedAt,
          },
        })
    );
  }

  async delete(id: OrganizationId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    await db.rls(tx =>
      tx.delete(organizations).where(eq(organizations.id, id.value))
    );
  }
}
