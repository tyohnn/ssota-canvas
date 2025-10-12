// apps/web/src/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository.ts

import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient, adminDb } from '@/db';
import { workspaceMembers } from '@/db/schema-dev';
import type { WorkspaceMember as DBWorkspaceMember } from '@/db/schema-dev';
import { WorkspaceMemberRepository } from '../interfaces/workspace-member.repository.interface';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

export class DrizzleWorkspaceMemberRepository
  implements WorkspaceMemberRepository
{
  /**
   * Workspace 멤버십 확인 (초대 여부만)
   *
   * 🔒 보안: adminDb 사용 (Application에서 조직 멤버십 확인 후)
   *
   * @param workspaceId - Workspace ID
   * @param userId - 사용자 ID
   * @returns 멤버 여부 (true: 초대됨, false: 초대 안됨)
   */
  async isMember(workspaceId: WorkspaceId, userId: string): Promise<boolean> {
    // Admin DB: Application 레벨에서 조직 멤버십 확인이 완료된 경우
    const result = await adminDb
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspace_id, workspaceId.value),
          eq(workspaceMembers.user_id, userId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Workspace 멤버 추가 (초대)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - 조직 admin/owner가 멤버 초대 시 (조직 권한 확인 후)
   *
   * @param workspaceId - Workspace ID
   * @param userId - 초대할 사용자 ID
   */
  async addMember(workspaceId: WorkspaceId, userId: string): Promise<void> {
    // Admin DB 사용 (Service에서 조직 admin 이상 권한 확인 후)
    await adminDb
      .insert(workspaceMembers)
      .values({
        workspace_id: workspaceId.value,
        user_id: userId,
        // role 필드 없음 (organization_members에서 관리)
        joined_at: new Date(),
      })
      .onConflictDoNothing(); // 중복 초대 시 무시 (idempotent)
  }

  /**
   * Workspace 멤버 제거
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - 조직 admin/owner가 멤버 제거 시
   * - 멤버 본인이 Workspace 나가기 시
   *
   * @param workspaceId - Workspace ID
   * @param userId - 제거할 사용자 ID
   */
  async removeMember(workspaceId: WorkspaceId, userId: string): Promise<void> {
    // Admin DB 사용 (Service에서 권한 확인 후)
    await adminDb
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspace_id, workspaceId.value),
          eq(workspaceMembers.user_id, userId)
        )
      );
  }
}
