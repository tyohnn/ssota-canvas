// apps/web/src/domains/user-management/read-models/user-profile.view.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema-dev';
import { OrganizationId, UserId } from '../../shared/value-objects/ids.vo';
import { UserManagementError } from '../../shared/errors/user-management.error';

// DTO for client-server communication (serializable)
export interface UserProfileView {
  userId: string; // Serialized from UserId
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string; // Serialized from OrganizationId
    name: string;
  };
  lastLoginAt?: string; // ISO 8601 string (serialized from Date)
  createdAt: string; // ISO 8601 string (serialized from Date)
}

export class DrizzleUserProfileViewRepository {
  async getByUserId(userId: UserId): Promise<UserProfileView | null> {
    const db = await createDrizzleSupabaseClient();

    // 사용자 프로필 조회
    const userProfile = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, userId.value),
      })
    );

    if (!userProfile) {
      return null;
    }

    // 기본 조직 조회 (소유자 조직 중 첫 번째)
    const defaultOrg = await db.rls(tx =>
      tx.query.organizations.findFirst({
        where: and(eq(organizations.owner_id, userId.value)),
      })
    );

    if (!defaultOrg) {
      throw new UserManagementError(
        'DEFAULT_ORGANIZATION_NOT_FOUND',
        'Default organization not found'
      );
    }

    // Serialize to DTO (plain object for Next.js client-server boundary)
    return {
      userId: userProfile.id, // Already a string
      email: userProfile.email,
      name: userProfile.name || 'User',
      profileImageUrl: userProfile.avatar_url || undefined,
      defaultOrganization: {
        id: defaultOrg.id, // Already a string
        name: defaultOrg.name,
      },
      lastLoginAt: undefined,
      createdAt: new Date(userProfile.created_at).toISOString(),
    };
  }
}
