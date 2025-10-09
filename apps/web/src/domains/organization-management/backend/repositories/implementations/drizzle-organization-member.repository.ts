// apps/web/src/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import {
  organizationMembers,
  organizations,
  invitations,
  profiles,
} from '@/db/schema-dev';
import type { OrganizationMember as DBOrganizationMember } from '@/db/schema-dev';
import {
  OrganizationMemberRepository,
  OrganizationMemberInfo,
} from '../interfaces/organization-member.repository.interface';
import {
  OrganizationMemberView,
  UserProfile,
} from '../../../shared/dtos/index';
import { OrganizationId, UserId } from '../../../shared/value-objects/ids.vo';
import { MemberRole } from '../../../shared/value-objects/member-role.vo';

export class DrizzleOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  async addMember(member: OrganizationMemberInfo): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // 멤버 추가는 시스템 레벨 작업 (초대 승낙 시 자동 추가)
    // adminDb 사용하여 RLS 우회
    await db.admin.insert(organizationMembers).values({
      organization_id: member.organizationId.value,
      user_id: member.userId.value,
      role: member.role.value,
      joined_at: member.joinedAt,
    });
  }

  async removeMember(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // 멤버 제거는 시스템 레벨 작업 (관리자가 멤버 제거)
    // adminDb 사용하여 RLS 우회
    await db.admin
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organization_id, organizationId.value),
          eq(organizationMembers.user_id, userId.value)
        )
      );
  }

  async findByOrganizationId(
    organizationId: OrganizationId
  ): Promise<OrganizationMemberInfo[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.organizationMembers.findMany({
        where: eq(organizationMembers.organization_id, organizationId.value),
        orderBy: (
          organizationMembersTable: typeof organizationMembers,
          { asc }: any
        ) => [asc(organizationMembersTable.joined_at)],
      })
    );

    return data.map((row: DBOrganizationMember) => ({
      organizationId: new OrganizationId(row.organization_id),
      userId: new UserId(row.user_id),
      role: new MemberRole(row.role),
      joinedAt: new Date(row.joined_at),
    }));
  }

  async findByUserId(userId: UserId): Promise<OrganizationMemberInfo[]> {
    const db = await createDrizzleSupabaseClient();

    // 사용자가 속한 모든 조직의 멤버십 조회 - RLS 사용
    const memberships = await db.rls(tx =>
      tx
        .select({
          organizationId: organizationMembers.organization_id,
          userId: organizationMembers.user_id,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joined_at,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.user_id, userId.value))
        .orderBy(organizationMembers.joined_at)
    );

    return memberships.map((row: (typeof memberships)[0]) => ({
      organizationId: new OrganizationId(row.organizationId),
      userId: new UserId(row.userId),
      role: new MemberRole(row.role),
      joinedAt: new Date(row.joinedAt),
    }));
  }

  async findMemberRole(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<MemberRole | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, organizationId.value),
          eq(organizationMembers.user_id, userId.value)
        ),
      })
    );

    if (!data) {
      return null;
    }

    return new MemberRole(data.role);
  }

  async isMember(
    organizationId: OrganizationId,
    userId: UserId
  ): Promise<boolean> {
    const role = await this.findMemberRole(organizationId, userId);
    return role !== null;
  }

  async updateMemberRole(
    organizationId: OrganizationId,
    userId: UserId,
    newRole: MemberRole
  ): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // 멤버 역할 변경은 시스템 레벨 작업 (관리자가 멤버 역할 변경)
    // adminDb 사용하여 RLS 우회
    await db.admin
      .update(organizationMembers)
      .set({ role: newRole.value })
      .where(
        and(
          eq(organizationMembers.organization_id, organizationId.value),
          eq(organizationMembers.user_id, userId.value)
        )
      );
  }

  // Query methods (Read Model - View)
  async getOrganizationMemberView(
    organizationId: string,
    currentUserId: string
  ): Promise<OrganizationMemberView> {
    const db = await createDrizzleSupabaseClient();

    // 🔑 Step 1: 현재 사용자의 membership 먼저 확인 (RLS로 자기 자신만 조회 가능)
    const userMembership = await db.rls(tx =>
      tx
        .select({
          userId: organizationMembers.user_id,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organization_id, organizationId),
            eq(organizationMembers.user_id, currentUserId)
          )
        )
        .limit(1)
    );

    // 🔑 Step 2: 조직 정보 조회 (Admin DB 사용 - 멤버십 확인 후)
    // Owner 확인을 위해 먼저 조회
    const organization = await db.admin
      .select({
        id: organizations.id,
        name: organizations.name,
        ownerId: organizations.owner_id,
        createdAt: organizations.created_at,
        ownerProfile: {
          userId: profiles.user_id,
          email: profiles.email,
          name: profiles.name,
          avatarUrl: profiles.avatar_url,
        },
      })
      .from(organizations)
      .leftJoin(profiles, eq(organizations.owner_id, profiles.user_id))
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (organization.length === 0) {
      throw new Error('Organization not found');
    }

    const org = organization[0]!; // length 체크 후이므로 안전

    // Owner인 경우 organization_members에 없을 수 있음
    const isOwner = org.ownerId === currentUserId;
    const userRole = isOwner ? 'owner' : userMembership[0]?.role;

    // 🔑 Step 3: Application-level 권한 체크
    if (!userRole) {
      throw new Error('Unauthorized: Not a member of this organization');
    }

    // 🔑 Step 4: 조직 멤버는 adminDb로 전체 멤버 조회 (RLS 우회)
    // Application 레벨에서 멤버십이 확인되었으므로 Admin DB 사용 안전
    const members = await db.admin
      .select({
        userId: organizationMembers.user_id,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joined_at,
        profile: {
          email: profiles.email,
          name: profiles.name,
          avatarUrl: profiles.avatar_url,
        },
      })
      .from(organizationMembers)
      .leftJoin(profiles, eq(organizationMembers.user_id, profiles.user_id))
      .where(eq(organizationMembers.organization_id, organizationId));

    // 🔑 Step 5: 소유자를 멤버 목록에 추가 (중복 체크)
    const currentMembers: OrganizationMemberView['currentMembers'] = [];

    // 소유자 추가
    if (org.ownerProfile) {
      const isOwnerInMembers = members.some(
        (m: (typeof members)[0]) => m.userId === org.ownerProfile!.userId
      );

      if (!isOwnerInMembers) {
        const ownerMember = {
          userId: org.ownerProfile.userId,
          email: org.ownerProfile.email,
          name: org.ownerProfile.name || org.ownerProfile.email,
          profileImageUrl: org.ownerProfile.avatarUrl || '',
          role: 'owner' as const,
          joinedAt: org.createdAt.toISOString(),
        };
        currentMembers.push(ownerMember);
      }
    }

    // 나머지 멤버 추가
    for (const member of members) {
      if (member.profile) {
        currentMembers.push({
          userId: member.userId,
          email: member.profile.email,
          name: member.profile.name || member.profile.email,
          profileImageUrl: member.profile.avatarUrl || '',
          role: member.role as 'owner' | 'admin' | 'member',
          joinedAt: member.joinedAt.toISOString(),
        });
      }
    }

    // 4. 대기 중인 초대 조회
    const pendingInvites = await db.rls(tx =>
      tx
        .select({
          id: invitations.id,
          inviteeEmail: invitations.invitee_email,
          role: invitations.role,
          createdAt: invitations.created_at,
          inviterUserId: invitations.inviter_user_id,
          inviterProfile: {
            name: profiles.name,
            email: profiles.email,
          },
        })
        .from(invitations)
        .leftJoin(profiles, eq(invitations.inviter_user_id, profiles.user_id))
        .where(
          and(
            eq(invitations.organization_id, organizationId),
            eq(invitations.status, 'pending')
          )
        )
    );

    const pendingInvitations = pendingInvites.map(
      (invite: (typeof pendingInvites)[0]) => ({
        id: invite.id,
        inviteeEmail: invite.inviteeEmail,
        role: invite.role as 'admin' | 'member',
        createdAt: invite.createdAt.toISOString(),
        inviterName:
          invite.inviterProfile?.name ||
          invite.inviterProfile?.email ||
          'Unknown',
      })
    );

    // 5. 최종 결과 반환 (userRole은 Step 3에서 이미 확인함)
    const result = {
      organizationId,
      currentMembers,
      pendingInvitations,
      userRole,
    };

    return result;
  }

  async searchUserProfileByEmail(email: string): Promise<UserProfile[]> {
    const db = await createDrizzleSupabaseClient();

    const searchResults = await db.rls(tx =>
      tx
        .select({
          userId: profiles.user_id,
          email: profiles.email,
          name: profiles.name,
          avatarUrl: profiles.avatar_url,
        })
        .from(profiles)
        .where(eq(profiles.email, email))
        .limit(10)
    );

    return searchResults.map((profile: (typeof searchResults)[0]) => ({
      userId: profile.userId,
      email: profile.email,
      name: profile.name || profile.email,
      profileImageUrl: profile.avatarUrl || '',
    }));
  }
}
