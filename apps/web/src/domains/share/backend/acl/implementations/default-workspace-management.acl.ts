// apps/web/src/domains/share/backend/acl/implementations/default-workspace-management.acl.ts

import {
  WorkspaceManagementAcl,
  WorkspaceSummary,
  PageSnapshot,
} from '../workspace-management.acl';
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

  async copyPageToWorkspace(
    _pageId: string,
    _workspaceId: string,
    _userId: string
  ): Promise<string> {
    const pageRepository = new DrizzlePageRepository();
    const workspaceMemberRepository = new DrizzleWorkspaceMemberRepository();
    const pageHierarchyService = new DefaultPageHierarchyService(
      pageRepository,
      workspaceMemberRepository
    );

    const sourcePage = await pageRepository.findById(new PageId(_pageId));
    if (!sourcePage) {
      throw new Error('Source page not found');
    }

    const createResult = await pageHierarchyService.createPage(
      new WorkspaceId(_workspaceId),
      null,
      `${sourcePage.title} (Copy)`,
      sourcePage.icon,
      _userId
    );

    if (!createResult.success) {
      throw new Error(createResult.error);
    }

    const newPageId = createResult.data;

    await adminDb.transaction(async tx => {
      const mountsWithBlocks = await tx
        .select({
          blockMountId: blockMounts.id,
          blockId: blockMounts.block_id,
          positionX: blockMounts.position_x,
          positionY: blockMounts.position_y,
          sizeWidth: blockMounts.size_width,
          sizeHeight: blockMounts.size_height,
          zOrder: blockMounts.z_order,
          blockType: blocks.block_type,
          title: blocks.title,
          metadata: blocks.metadata,
          properties: blocks.properties,
          content: blocks.content,
          contentRaw: blocks.content_raw,
          customProperties: blocks.custom_properties,
        })
        .from(blockMounts)
        .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
        .where(
          and(
            eq(blockMounts.page_id, _pageId),
            isNull(blockMounts.deleted_at),
            isNull(blocks.deleted_at)
          )
        );

      const blockMountIdMap = new Map<string, string>();

      for (const row of mountsWithBlocks) {
        const newBlockId = crypto.randomUUID();
        const newBlockMountId = crypto.randomUUID();

        blockMountIdMap.set(row.blockMountId, newBlockMountId);

        await tx.insert(blocks).values({
          id: newBlockId,
          workspace_id: _workspaceId,
          block_type: row.blockType,
          title: row.title,
          metadata: row.metadata,
          properties: row.properties,
          content: row.content,
          content_raw: row.contentRaw,
          custom_properties: row.customProperties,
          created_by: _userId,
          created_at: new Date(),
          updated_at: new Date(),
        });

        await tx.insert(blockMounts).values({
          id: newBlockMountId,
          page_id: newPageId,
          block_id: newBlockId,
          position_x: row.positionX,
          position_y: row.positionY,
          size_width: row.sizeWidth,
          size_height: row.sizeHeight,
          z_order: row.zOrder,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      const edgeRows = await tx
        .select({
          id: edges.id,
          sourceBlockMountId: edges.source_block_mount_id,
          targetBlockMountId: edges.target_block_mount_id,
          sourceHandle: edges.source_handle,
          targetHandle: edges.target_handle,
          edgeShape: edges.edge_shape,
          edgeLabel: edges.edge_label,
          edgeStyleColor: edges.edge_style_color,
          edgeStyleThickness: edges.edge_style_thickness,
        })
        .from(edges)
        .where(and(eq(edges.page_id, _pageId), isNull(edges.deleted_at)));

      for (const edgeRow of edgeRows) {
        const newSourceId = blockMountIdMap.get(edgeRow.sourceBlockMountId);
        const newTargetId = blockMountIdMap.get(edgeRow.targetBlockMountId);

        if (!newSourceId || !newTargetId) {
          continue;
        }

        await tx.insert(edges).values({
          id: crypto.randomUUID(),
          page_id: newPageId,
          source_block_mount_id: newSourceId,
          target_block_mount_id: newTargetId,
          source_handle: edgeRow.sourceHandle,
          target_handle: edgeRow.targetHandle,
          edge_shape: edgeRow.edgeShape,
          edge_label: edgeRow.edgeLabel,
          edge_style_color: edgeRow.edgeStyleColor,
          edge_style_thickness: edgeRow.edgeStyleThickness,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });

    return newPageId;
  }
}
