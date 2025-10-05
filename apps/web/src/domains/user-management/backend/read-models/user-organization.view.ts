// apps/web/src/domains/user-management/read-models/user-organization.view.ts

import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema';
import type { Organization as DBOrganization } from '@/db/schema-dev';
import { OrganizationId, UserId } from '../../shared/value-objects/ids.vo';

export interface UserOrganizationView {
  userId: UserId;
  ownedOrganizations: OrganizationSummary[];
  memberOrganizations: OrganizationSummary[]; // Scenario 0-1에서는 빈 배열
}

export interface OrganizationSummary {
  id: OrganizationId;
  name: string;
  role: 'owner' | 'member';
  isDefault: boolean;
  createdAt: Date;
}

export class DrizzleUserOrganizationViewRepository {
  async getByUserId(userId: UserId): Promise<UserOrganizationView | null> {
    const db = await createDrizzleSupabaseClient();

    // 사용자 프로필과 소유 조직을 함께 조회
    const userWithOrgs = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.user_id, userId.value),
        with: {
          // Note: relations need to be defined in schema
        },
      })
    );

    if (!userWithOrgs) {
      return null;
    }

    // 소유 조직 별도 조회
    const ownedOrgs = await db.rls(tx =>
      tx.query.organizations.findMany({
        where: eq(organizations.owner_id, userId.value),
        orderBy: (orgs: typeof organizations, { asc }: any) => [
          asc(orgs.created_at),
        ],
      })
    );

    const ownedOrganizations: OrganizationSummary[] = ownedOrgs.map(
      (org: DBOrganization) => ({
        id: new OrganizationId(org.id),
        name: org.name,
        role: 'owner' as const,
        isDefault: org.is_default ?? false,
        createdAt: new Date(org.created_at),
      })
    );

    return {
      userId,
      ownedOrganizations,
      memberOrganizations: [], // Scenario 0-1에서는 멤버십 없음
    };
  }
}
