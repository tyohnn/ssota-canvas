// apps/web/src/domains/share/backend/services/default-workspace-management.acl.ts

import {
  WorkspaceManagementAcl,
  WorkspaceSummary,
  PageSnapshot,
  PageInfo,
  WorkspaceInfo,
} from './workspace-management.acl';
import { adminDb } from '@/db';
import {
  organizations,
  workspaces,
  workspaceMembers,
  blocks,
  blockMounts,
  edges,
} from '@/db/schema';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DefaultPageHierarchyService } from '@/domains/workspace-management/backend/services/page-hierarchy.service';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

export class DefaultWorkspaceManagementAcl implements WorkspaceManagementAcl {
  async getPageSnapshot(_pageId: string): Promise<PageSnapshot> {
    // TODO: Integrate with Workspace Management Domain (Page Structure Context)
    throw new Error('getPageSnapshot not implemented');
  }

  async getWorkspacesForUser(_userId: string): Promise<WorkspaceSummary[]> {
    const rows = await adminDb
      .select({
        id: workspaces.id,
        name: workspaces.name,
        icon: workspaces.icon,
        organizationName: organizations.name,
      })
      .from(workspaces)
      .leftJoin(
        workspaceMembers,
        eq(workspaces.id, workspaceMembers.workspace_id)
      )
      .leftJoin(organizations, eq(workspaces.organization_id, organizations.id))
      .where(
        and(
          isNull(workspaces.deleted_at),
          or(
            eq(workspaceMembers.user_id, _userId),
            eq(workspaces.owner_id, _userId)
          )
        )
      )
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      organizationName: row.organizationName ?? undefined,
    }));
  }

  async getPageInfo(pageId: string): Promise<PageInfo | null> {
    const pageRepository = new DrizzlePageRepository();
    const page = await pageRepository.findById(new PageId(pageId));

    if (!page) {
      return null;
    }

    return {
      pageId: page.pageId.value,
      title: page.title,
      icon: page.icon ?? undefined,
      workspaceId: page.workspaceId?.value,
    };
  }

  async getWorkspaceInfo(workspaceId: string): Promise<WorkspaceInfo | null> {
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const workspace = await workspaceRepository.findById(
      new WorkspaceId(workspaceId)
    );

    if (!workspace) {
      return null;
    }

    return {
      workspaceId: workspace.workspaceId.value,
      organizationId: workspace.organizationId?.value,
    };
  }
}
