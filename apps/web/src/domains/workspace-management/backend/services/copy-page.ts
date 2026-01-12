// apps/web/src/domains/workspace-management/backend/services/copy-page.ts

import { PageRepository } from '../repositories/interfaces/page.repository.interface';
import { PageId } from '../../shared/value-objects/page-id.vo';
import type { Result } from './interfaces/common.types';
import { Result as R } from './interfaces/common.types';
import { PageAggregate } from '../../shared/aggregates/page.aggregate';
import { CanvasQueryService } from '@/domains/canvas-management/backend/services/canvas-query.service';
import { CanvasBlockMountService } from '@/domains/canvas-management/backend/services/canvas-block-mount.service';
import { CanvasEdgeService } from '@/domains/canvas-management/backend/services/canvas-edge.service';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';

/**
 * 페이지를 다른 워크스페이스로 복제
 * 
 * @param sourcePageId - 원본 페이지 ID
 * @param targetWorkspaceId - 대상 워크스페이스 ID
 * @param userId - 사용자 ID
 * @param pageRepo - 페이지 레포지토리
 * @returns 복제된 페이지 ID
 */
export async function copyPageToWorkspace(
  sourcePageId: string,
  targetWorkspaceId: string,
  userId: string,
  pageRepo: PageRepository
): Promise<Result<string>> {
  try {
    // 1. 원본 페이지 조회
    const sourcePage = await pageRepo.findById(new PageId(sourcePageId));
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

    await pageRepo.save(newPageAgg);
    const newPageId = newPageAgg.page.pageId.value;

    // 3. 캔버스 데이터 복제 (외부 도메인 서비스 사용)
    const blockMountRepo = new DrizzleBlockMountRepository();
    const edgeRepo = new DrizzleEdgeRepository();
    const blockRepo = new DrizzleBlockRepository();
    const viewportRepo = new DrizzleViewportRepository();

    const canvasQueryService = new CanvasQueryService(
      blockMountRepo,
      edgeRepo,
      viewportRepo
    );

    const blockManagementService = new BlockManagementService(blockRepo);
    const canvasBlockMountService = new CanvasBlockMountService(
      blockManagementService,
      blockMountRepo,
      edgeRepo
    );

    const canvasEdgeService = new CanvasEdgeService(
      blockMountRepo,
      edgeRepo
    );

    // 원본 캔버스 데이터 조회
    const canvasViewResult = await canvasQueryService.getCanvasView(
      new PageId(sourcePageId),
      new UserId(userId)
    );

    if (canvasViewResult.isError()) {
      return R.err(`FAILED_TO_LOAD_SOURCE_CANVAS: ${canvasViewResult.error.message}`);
    }

    const { blocks: sourceBlocks, edges: sourceEdges } = canvasViewResult.value;

    const blockMountIdMap = new Map<string, string>();

    // 3-1. 블록 복제
    for (const block of sourceBlocks) {
      const createResult = await canvasBlockMountService.createAndMountBlock({
        userId: new UserId(userId),
        workspaceId: new WorkspaceId(targetWorkspaceId),
        pageId: new PageId(newPageId),
        blockType: new BlockType(block.blockType),
        position: new Position(block.position.x, block.position.y),
        size: new Size(block.size.width, block.size.height),
        title: block.title,
        initialProperties: block.properties,
        initialContent: block.content,
      });

      if (createResult.isError()) {
        console.error(`❌ [copyPageToWorkspace] Failed to duplicate block: ${createResult.error.message}`);
        continue;
      }

      const newBlockMountId = createResult.value.blockMountAggregate.getBlockMount().id.value;
      blockMountIdMap.set(block.blockMountId, newBlockMountId);
    }

    // 3-2. 엣지 복제
    for (const edge of sourceEdges) {
      const newSourceId = blockMountIdMap.get(edge.sourceBlockMountId);
      const newTargetId = blockMountIdMap.get(edge.targetBlockMountId);

      if (!newSourceId || !newTargetId) {
        continue;
      }

      const edgeResult = await canvasEdgeService.createEdge({
        pageId: new PageId(newPageId),
        sourceBlockMountId: new BlockMountId(newSourceId),
        targetBlockMountId: new BlockMountId(newTargetId),
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
        edgeShape: undefined, // Need to handle edge shape if available
        userId,
      });

      if (edgeResult.isError()) {
        console.warn(`⚠️ [copyPageToWorkspace] Failed to duplicate edge: ${edgeResult.error.message}`);
      }
    }

    return R.ok(newPageId);
  } catch (error) {
    if (error instanceof Error) {
      return R.err(error.message);
    }
    return R.err('UNKNOWN_ERROR');
  }
}
