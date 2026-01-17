// apps/web/src/domains/workspace-management/backend/read-models/workspace-selection.view.ts

import { eq, and, or, isNull, desc } from 'drizzle-orm';
import { adminDb } from '@/db';
import { workspaces, workspaceMembers, organizations } from '@/db/schema';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';

/**
 * Workspace Selection View DTO
 * 
 * Share 도메인 등에서 사용하는 Workspace 선택 UI용 Read Model
 * Use Case에 최적화된 구조로 필요한 데이터만 포함
 */
export interface WorkspaceSelectionView {
  id: string;
  name: string;
  icon?: string;
  organization: {
    id: string;
    name: string;
    // 나중에 필요하면 여기에 추가 가능 (예: type, ownerId 등)
  } | null;
}

/**
 * Workspace Selection View Repository
 * 
 * 사용자가 멤버인 Workspace 목록을 조회하는 Read Model
 * Organization 정보를 포함하여 UI에 최적화된 구조로 반환
 */
export class DrizzleWorkspaceSelectionViewRepository {
  /**
   * 사용자가 멤버(또는 소유자)로 참여 중인 모든 Workspace 조회
   * 
   * Share 도메인 등에서 Workspace 선택 UI를 위해 사용
   * Use Case에 최적화된 단일 쿼리로 필요한 모든 데이터를 조회
   * 
   * @param userId - 사용자 ID
   * @returns Workspace Selection View 배열
   */
  async getByUserId(userId: UserId): Promise<WorkspaceSelectionView[]> {
    // Use Case에 최적화된 단일 쿼리
    const result = await adminDb
      .select({
        workspace: workspaces,
        organization: organizations,
      })
      .from(workspaces)
      .leftJoin(
        workspaceMembers,
        eq(workspaces.id, workspaceMembers.workspace_id)
      )
      .leftJoin(
        organizations,
        eq(workspaces.organization_id, organizations.id)
      )
      .where(
        and(
          isNull(workspaces.deleted_at),
          or(
            eq(workspaceMembers.user_id, userId.value),
            eq(workspaces.owner_id, userId.value)
          )
        )
      )
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    return result.map(row => ({
      id: row.workspace.id,
      name: row.workspace.name,
      icon: row.workspace.icon ?? undefined,
      organization: row.organization
        ? {
            id: row.organization.id,
            name: row.organization.name,
            // 나중에 필요하면 여기에 추가 가능
            // type: row.organization.organization_type,
            // ownerId: row.organization.owner_id,
          }
        : null,
    }));
  }
}
