// apps/web/src/domains/organization-management/backend/repositories/implementations/drizzle-invitation.repository.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { invitations } from '@/db/schema-dev';
import type { Invitation as DBInvitation } from '@/db/schema-dev';
import { InvitationRepository } from '../interfaces/invitation.repository.interface';
import { InvitationAggregate } from '../../../shared/aggregates/invitation.aggregate';
import { Invitation } from '../../../shared/entities/invitation.entity';
import {
  OrganizationId,
  UserId,
  InvitationId,
} from '../../../shared/value-objects/ids.vo';
import { MemberRole } from '../../../shared/value-objects/member-role.vo';

export class DrizzleInvitationRepository implements InvitationRepository {
  async findById(id: InvitationId): Promise<InvitationAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.invitations.findFirst({
        where: eq(invitations.id, id.value),
      })
    );

    if (!data) {
      return null;
    }

    return this.mapToAggregate(data);
  }

  async findByOrganizationId(
    organizationId: OrganizationId
  ): Promise<InvitationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.invitations.findMany({
        where: eq(invitations.organization_id, organizationId.value),
        orderBy: (invitationsTable: typeof invitations, { desc }: any) => [
          desc(invitationsTable.created_at),
        ],
      })
    );

    return data.map((row: DBInvitation) => this.mapToAggregate(row));
  }

  async findByInviteeEmail(
    email: string,
    organizationId: OrganizationId
  ): Promise<InvitationAggregate | null> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.invitations.findFirst({
        where: and(
          eq(invitations.invitee_email, email),
          eq(invitations.organization_id, organizationId.value),
          eq(invitations.status, 'pending')
        ),
      })
    );

    if (!data) {
      return null;
    }

    return this.mapToAggregate(data);
  }

  async findByInviteeUserId(userId: UserId): Promise<InvitationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.invitations.findMany({
        where: eq(invitations.invitee_user_id, userId.value),
        orderBy: (invitationsTable: typeof invitations, { desc }: any) => [
          desc(invitationsTable.created_at),
        ],
      })
    );

    return data.map((row: DBInvitation) => this.mapToAggregate(row));
  }

  async findPendingByOrganizationId(
    organizationId: OrganizationId
  ): Promise<InvitationAggregate[]> {
    const db = await createDrizzleSupabaseClient();

    const data = await db.rls(tx =>
      tx.query.invitations.findMany({
        where: and(
          eq(invitations.organization_id, organizationId.value),
          eq(invitations.status, 'pending')
        ),
        orderBy: (invitationsTable: typeof invitations, { desc }: any) => [
          desc(invitationsTable.created_at),
        ],
      })
    );

    return data.map((row: DBInvitation) => this.mapToAggregate(row));
  }

  async save(invitationAggregate: InvitationAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // Invitation 저장은 시스템 레벨 작업
    // - 초대 생성: Service에서 Owner/Admin 권한 체크 완료
    // - 초대 승낙/거절: Service에서 invitee 확인 완료
    // adminDb 사용하여 RLS 우회
    await db.admin
      .insert(invitations)
      .values({
        id: invitationAggregate.id.value,
        organization_id: invitationAggregate.entity.organizationId.value,
        inviter_user_id: invitationAggregate.entity.inviterUserId.value,
        invitee_email: invitationAggregate.entity.inviteeEmail,
        invitee_user_id:
          invitationAggregate.entity.inviteeUserId?.value || null,
        role: invitationAggregate.entity.role.value,
        status: invitationAggregate.entity.status,
        created_at: invitationAggregate.entity.createdAt,
        responded_at: invitationAggregate.entity.respondedAt,
      })
      .onConflictDoUpdate({
        target: invitations.id,
        set: {
          invitee_user_id:
            invitationAggregate.entity.inviteeUserId?.value || null,
          status: invitationAggregate.entity.status,
          responded_at: invitationAggregate.entity.respondedAt,
        },
      });
  }

  async delete(id: InvitationId): Promise<void> {
    const db = await createDrizzleSupabaseClient();

    // Invitation 삭제는 시스템 레벨 작업 (관리자가 초대 취소)
    // adminDb 사용하여 RLS 우회
    await db.admin.delete(invitations).where(eq(invitations.id, id.value));
  }

  private mapToAggregate(row: DBInvitation): InvitationAggregate {
    const invitation = new Invitation(
      new InvitationId(row.id),
      new OrganizationId(row.organization_id),
      new UserId(row.inviter_user_id),
      row.invitee_email,
      row.invitee_user_id ? new UserId(row.invitee_user_id) : null,
      new MemberRole(row.role),
      row.status,
      new Date(row.created_at),
      row.responded_at ? new Date(row.responded_at) : null
    );

    return new InvitationAggregate(invitation);
  }
}
