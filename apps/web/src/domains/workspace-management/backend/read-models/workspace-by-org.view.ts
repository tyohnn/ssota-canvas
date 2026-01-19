// apps/web/src/domains/workspace-management/backend/read-models/workspace-by-org.view.ts

import { eq, and, or, isNull, desc, sql } from 'drizzle-orm';
import { adminDb } from '@/db';
import { workspaces, workspaceMembers, organizations } from '@/db/schema';
import { UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';

/**
 * Organization with Workspaces View DTO
 * 
 * 사용자가 멤버인 Workspace 목록을 Organization별로 그룹핑한 Read Model
 * SQL의 jsonb_agg를 사용하여 조직별로 워크스페이스를 배열로 포함
 */
export interface OrganizationWithWorkspacesView {
  id: string;
  name: string;
  workspaces: {
    id: string;
    name: string;
    icon?: string;
  }[];
}

/**
 * Workspace By Org View Repository
 * 
 * 사용자가 멤버인 Workspace 목록을 Organization별로 그룹핑하여 조회하는 Read Model
 * SQL의 GROUP BY와 jsonb_agg를 사용하여 서버 측 그룹핑을 수행
 */
export class DrizzleWorkspaceByOrgViewRepository {
  /**
   * 사용자가 멤버(또는 소유자)로 참여 중인 모든 Workspace를 Organization별로 그룹핑하여 조회
   * 
   * Share 도메인 등에서 Workspace 선택 UI를 위해 사용
   * PostgreSQL의 jsonb_agg를 사용하여 SQL 레벨에서 그룹핑 수행
   * 
   * @param userId - 사용자 ID
   * @returns Organization별로 그룹핑된 Workspace 목록
   */
  async getByUserId(userId: UserId): Promise<OrganizationWithWorkspacesView[]> {
    // SQL의 GROUP BY와 jsonb_agg를 사용하여 조직별로 그룹핑
    const result = await adminDb
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        workspaces: sql<Array<{ id: string; name: string; icon?: string }>>`
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', ${workspaces.id},
                'name', ${workspaces.name},
                'icon', ${workspaces.icon}
              ) ORDER BY ${workspaces.is_default} DESC, ${workspaces.created_at}
            ) FILTER (WHERE ${workspaces.id} IS NOT NULL),
            '[]'::jsonb
          )
        `.as('workspaces'),
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
      .groupBy(organizations.id, organizations.name)
      .orderBy(organizations.name);

    // null organization 제거 및 타입 변환
    return result
      .filter(row => row.orgId !== null)
      .map(row => ({
        id: row.orgId!,
        name: row.orgName!,
        workspaces: row.workspaces || [],
      }));
  }
}
