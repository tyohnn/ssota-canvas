import { PageRepository } from '../repositories/interfaces/page.repository.interface';
import { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import { PageId } from '../../shared/value-objects/page-id.vo';
import type { Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { adminDb } from '@/db';
import { blocks, blockMounts, edges } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Page Copy Service
 * 
 * 페이지 복제 기능을 담당하는 서비스
 */
export class PageCopyService {
  constructor(private readonly pageRepo: PageRepository) { }

  /**
   * 페이지를 다른 워크스페이스로 복제
   * 
   * @param sourcePageId - 원본 페이지 ID
   * @param targetWorkspaceId - 대상 워크스페이스 ID
   * @param userId - 사용자 ID
   * @returns 복제된 페이지 ID
   */
  async copyPageToWorkspace(
    sourcePageId: string,
    targetWorkspaceId: string,
    userId: string
  ): Promise<Result<string>> {
    try {
      // 1. 원본 페이지 조회
      const sourcePage = await this.pageRepo.findById(new PageId(sourcePageId));
      if (!sourcePage) {
        return R.err('PAGE_NOT_FOUND');
      }

      // 2. 새 페이지 생성
      const newPageAgg = PageAggregate.create(
        {
          workspaceId: targetWorkspaceId,
          parentId: undefined,
          title: `${sourcePage.title} (Copy)`,
          icon: sourcePage.icon ?? undefined,
          createdBy: userId,
        },
        null
      );

      await this.pageRepo.save(newPageAgg);
      const newPageId = newPageAgg.page.pageId.value;

      // 3. 블록과 마운트 복제 (트랜잭션)
      await adminDb.transaction(async tx => {
        // 블록 마운트와 블록 정보 조회
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
              eq(blockMounts.page_id, sourcePageId),
              isNull(blockMounts.deleted_at),
              isNull(blocks.deleted_at)
            )
          );

        const blockMountIdMap = new Map<string, string>();

        // 블록과 마운트 복제
        for (const row of mountsWithBlocks) {
          const newBlockId = crypto.randomUUID();
          const newBlockMountId = crypto.randomUUID();

          blockMountIdMap.set(row.blockMountId, newBlockMountId);

          await tx.insert(blocks).values({
            id: newBlockId,
            workspace_id: targetWorkspaceId,
            block_type: row.blockType,
            title: row.title,
            metadata: row.metadata,
            properties: row.properties,
            content: row.content,
            content_raw: row.contentRaw,
            custom_properties: row.customProperties,
            created_by: userId,
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

        // 엣지 복제
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
          .where(and(eq(edges.page_id, sourcePageId), isNull(edges.deleted_at)));

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

      return R.ok(newPageId);
    } catch (error) {
      if (error instanceof Error) {
        return R.err(error.message);
      }
      return R.err('UNKNOWN_ERROR');
    }
  }
}
