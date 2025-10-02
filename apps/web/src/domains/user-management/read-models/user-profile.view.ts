// apps/web/src/domains/user-management/read-models/user-profile.view.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema';
import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';

export interface UserProfileView {
  userId: UserId;
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: OrganizationId;
    name: string;
  };
  lastLoginAt?: Date;
  createdAt: Date;
}

export class DrizzleUserProfileViewRepository {
  async getByUserId(userId: UserId): Promise<UserProfileView | null> {
    const db = await createDrizzleSupabaseClient();

    // 사용자 프로필 조회
    const userProfile = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.user_id, userId.value),
      })
    );

    if (!userProfile) {
      return null;
    }

    // 기본 조직 조회
    const defaultOrg = await db.rls(tx =>
      tx.query.organizations.findFirst({
        where: and(
          eq(organizations.owner_id, userId.value)
          // @ts-expect-error - isDefault will be added to schema
          // eq(organizations.is_default, true)
        ),
        orderBy: (organizations, { asc }) => [asc(organizations.created_at)],
        limit: 1,
      })
    );

    if (!defaultOrg) {
      throw new UserManagementError(
        'DEFAULT_ORGANIZATION_NOT_FOUND',
        'Default organization not found'
      );
    }

    return {
      userId: new UserId(userProfile.user_id),
      email: userProfile.email,
      name:
        [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || 'User',
      profileImageUrl: userProfile.image_url || undefined,
      defaultOrganization: {
        id: new OrganizationId(defaultOrg.id),
        name: defaultOrg.name,
      },
      lastLoginAt: undefined, // Supabase Auth에서 별도 관리
      createdAt: new Date(userProfile.created_at),
    };
  }
}

