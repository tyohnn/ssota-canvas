import { eq, and } from 'drizzle-orm';
import { adminDb } from '@/db';
import { workspaceInvitations, profiles } from '@/db/schema-dev';
import type { WorkspaceInvitation as DBWorkspaceInvitation } from '@/db/schema-dev';
import {
  IWorkspaceInvitationRepository,
  WorkspaceInvitationWithProfiles,
} from '../interfaces/workspace-invitation.repository.interface';
import { WorkspaceInvitation } from '../../../shared/entities/workspace-invitation.entity';
import { WorkspaceInvitationId } from '../../../shared/value-objects/workspace-invitation-id.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

/**
 * DrizzleWorkspaceInvitationRepository
 *
 * Workspace 초대 데이터 영속성 구현 (Drizzle ORM + Admin DB)
 */
export class DrizzleWorkspaceInvitationRepository
  implements IWorkspaceInvitationRepository
{
  /**
   * 초대 저장 (생성 또는 업데이트)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   */
  async save(invitation: WorkspaceInvitation): Promise<void> {
    // Check if invitation exists
    const existing = await adminDb
      .select()
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.id, invitation.id.value))
      .limit(1);

    if (existing.length > 0) {
      // Update
      await adminDb
        .update(workspaceInvitations)
        .set({
          status: invitation.status,
          notification_id: invitation.notificationId,
          processed_at: invitation.processedAt,
        })
        .where(eq(workspaceInvitations.id, invitation.id.value));
    } else {
      // Insert
      await adminDb.insert(workspaceInvitations).values({
        id: invitation.id.value,
        workspace_id: invitation.workspaceId.value,
        invited_user_id: invitation.invitedUserId,
        invited_by: invitation.invitedBy,
        status: invitation.status,
        notification_id: invitation.notificationId,
        created_at: invitation.createdAt,
        processed_at: invitation.processedAt,
      });
    }
  }

  /**
   * ID로 초대 조회
   */
  async findById(
    id: WorkspaceInvitationId
  ): Promise<WorkspaceInvitation | null> {
    const result = await adminDb
      .select()
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.id, id.value))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]!);
  }

  /**
   * 사용자별 초대 목록 조회
   */
  async findByUserId(userId: string): Promise<WorkspaceInvitation[]> {
    const result = await adminDb
      .select()
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.invited_user_id, userId));

    return result.map(row => this.mapToDomain(row));
  }

  /**
   * Workspace별 pending 초대 목록 조회
   */
  async findPendingByWorkspace(
    workspaceId: WorkspaceId
  ): Promise<WorkspaceInvitation[]> {
    const result = await adminDb
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspace_id, workspaceId.value),
          eq(workspaceInvitations.status, 'pending')
        )
      );

    return result.map(row => this.mapToDomain(row));
  }

  /**
   * Workspace별 pending 초대 목록 조회 (Profile JOIN)
   */
  async findPendingByWorkspaceWithProfiles(
    workspaceId: WorkspaceId
  ): Promise<WorkspaceInvitationWithProfiles[]> {
    const result = await adminDb
      .select({
        id: workspaceInvitations.id,
        workspaceId: workspaceInvitations.workspace_id,
        invitedUserId: workspaceInvitations.invited_user_id,
        invitedBy: workspaceInvitations.invited_by,
        status: workspaceInvitations.status,
        createdAt: workspaceInvitations.created_at,
        processedAt: workspaceInvitations.processed_at,
        // Profile 정보 (초대받은 사람)
        invitedUserName: profiles.name,
        invitedUserEmail: profiles.email,
        // Profile 정보는 Alias를 사용해야 하므로 별도 쿼리로 처리
      })
      .from(workspaceInvitations)
      .innerJoin(
        profiles,
        eq(workspaceInvitations.invited_user_id, profiles.id)
      )
      .where(
        and(
          eq(workspaceInvitations.workspace_id, workspaceId.value),
          eq(workspaceInvitations.status, 'pending')
        )
      )
      .orderBy(workspaceInvitations.created_at);

    // 각 초대에 대해 초대한 사람 프로필 조회
    const resultsWithProfiles: WorkspaceInvitationWithProfiles[] = [];

    for (const row of result) {
      // 초대한 사람 프로필 조회
      const inviterProfile = await adminDb
        .select({
          name: profiles.name,
          email: profiles.email,
        })
        .from(profiles)
        .where(eq(profiles.id, row.invitedBy))
        .limit(1);

      resultsWithProfiles.push({
        id: new WorkspaceInvitationId(row.id),
        workspaceId: new WorkspaceId(row.workspaceId),
        invitedUserId: row.invitedUserId,
        invitedUserName: row.invitedUserName || row.invitedUserEmail,
        invitedUserEmail: row.invitedUserEmail,
        invitedBy: row.invitedBy,
        inviterName:
          inviterProfile[0]?.name || inviterProfile[0]?.email || 'Unknown',
        status: row.status,
        createdAt: new Date(row.createdAt),
        processedAt: row.processedAt ? new Date(row.processedAt) : null,
      });
    }

    return resultsWithProfiles;
  }

  /**
   * 특정 초대 조회 (중복 확인용)
   */
  async findInvitation(
    workspaceId: WorkspaceId,
    userId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
  ): Promise<WorkspaceInvitation | null> {
    const result = await adminDb
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspace_id, workspaceId.value),
          eq(workspaceInvitations.invited_user_id, userId),
          eq(workspaceInvitations.status, status)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]!);
  }

  /**
   * 초대 상태 업데이트
   */
  async updateStatus(
    id: WorkspaceInvitationId,
    status: 'accepted' | 'rejected'
  ): Promise<void> {
    await adminDb
      .update(workspaceInvitations)
      .set({
        status,
        processed_at: new Date(),
      })
      .where(eq(workspaceInvitations.id, id.value));
  }

  /**
   * DB Row → Domain Entity 변환
   */
  private mapToDomain(row: DBWorkspaceInvitation): WorkspaceInvitation {
    return new WorkspaceInvitation(
      new WorkspaceInvitationId(row.id),
      new WorkspaceId(row.workspace_id),
      row.invited_user_id,
      row.invited_by,
      row.status,
      row.notification_id,
      new Date(row.created_at),
      row.processed_at ? new Date(row.processed_at) : null
    );
  }
}
