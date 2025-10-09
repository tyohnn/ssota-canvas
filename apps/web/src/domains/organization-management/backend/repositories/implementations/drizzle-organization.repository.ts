// apps/web/src/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import { organizations } from '@/db/schema-dev';
import type { Organization as DBOrganization } from '@/db/schema-dev';
import { OrganizationRepository } from '../interfaces/organization.repository.interface';
import { OrganizationAggregate } from '../../../shared/aggregates/organization.aggregate';
import { Organization } from '../../../shared/entities/organization.entity';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';

export class DrizzleOrganizationRepository implements OrganizationRepository {
  /**
   * 조직 조회 (ID 기반) - RLS 적용
   *
   * 🔒 보안: RLS 정책으로 Owner만 조회 가능
   */
  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    // RLS DB: Owner만 조회 가능 (RLS policy로 보안)
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
      data.organization_type,
      new UserId(data.owner_id),
      data.is_default ?? false,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    return new OrganizationAggregate(organization);
  }

  /**
   * 조직 조회 (ID 기반) - Admin DB 사용
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - Admin이 멤버 초대 시 (Service에서 Admin 권한 확인 후)
   * - Admin이 역할 변경 시 (Service에서 Admin 권한 확인 후)
   * - 멤버십 확인 후 조직 조회 (getUserOrganizations)
   */
  async findByIdAsAdmin(
    id: OrganizationId
  ): Promise<OrganizationAggregate | null> {
    // Admin DB: Application 레벨에서 권한 검증이 완료된 경우
    const [data] = await adminDb
      .select()
      .from(organizations)
      .where(eq(organizations.id, id.value))
      .limit(1);

    if (!data) {
      return null;
    }

    const organization = new Organization(
      new OrganizationId(data.id),
      data.name,
      data.organization_type,
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
        row.organization_type,
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
          organization_type: organizationAggregate.entity.organizationType,
          owner_id: organizationAggregate.entity.ownerId.value,
          is_default: organizationAggregate.entity.isDefault,
          created_at: organizationAggregate.entity.createdAt,
          updated_at: organizationAggregate.entity.updatedAt,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: organizationAggregate.entity.name,
            organization_type: organizationAggregate.entity.organizationType,
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
