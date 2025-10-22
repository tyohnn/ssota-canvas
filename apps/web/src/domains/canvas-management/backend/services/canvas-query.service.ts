// apps/web/src/domains/canvas-management/backend/services/canvas-query.service.ts

import { Result } from '@/utils/result';
import type { CanvasQueryService } from './interfaces/canvas-query.service.interface';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import type { ViewportRepository } from '../repositories/interfaces/viewport.repository.interface';
import type { CanvasViewData } from '../../shared/dtos';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

class CanvasManagementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CanvasManagementError';
  }
}

/**
 * Default Canvas Query Service
 *
 * 캔버스 데이터 조회를 담당 (Read Model 패턴)
 */
export class DefaultCanvasQueryService implements CanvasQueryService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository
  ) {}

  /**
   * 캔버스 뷰 데이터 조회 (BlockMount와 Block을 JOIN해서 조회)
   *
   * @param pageId - 페이지 ID
   * @param userId - 사용자 ID
   * @returns CanvasViewData (성공) | Error (실패)
   */
  async getCanvasView(
    pageId: PageId,
    userId: UserId
  ): Promise<Result<CanvasViewData, Error>> {
    try {
      // 권한 확인은 getCanvasViewAction에서 verifyPageAccess로 처리됨
      // 이 서비스는 이미 권한이 확인된 상태에서만 호출됨

      // 1. BlockMountRepository와 Block을 JOIN해서 조회
      const blockMountsWithBlocks =
        await this.blockMountRepository.findByPageIdWithBlocks(pageId);

      // 2. EdgeRepository.findByPageId()
      const edges = await this.edgeRepository.findByPageId(pageId);

      // 3. ViewportRepository.findByPageId()
      const viewportAggregate =
        await this.viewportRepository.findByPageId(pageId);

      // 4. blockId → blockMountId 매핑 생성 (React Flow는 blockMountId를 노드 ID로 사용)
      const blockIdToMountIdMap = new Map<string, string>();
      blockMountsWithBlocks.forEach(({ blockMount }) => {
        blockIdToMountIdMap.set(
          blockMount.blockMount.blockId.value,
          blockMount.blockMount.id.value
        );
      });

      // 5. 모든 데이터 조합하여 CanvasViewData 생성
      const canvasViewData: CanvasViewData = {
        pageId: pageId.value,
        blocks: blockMountsWithBlocks.map(({ blockMount, block }) => ({
          blockMountId: blockMount.blockMount.id.value,
          blockId: blockMount.blockMount.blockId.value,
          blockType: block.blockType.value,
          position: {
            x: blockMount.blockMount.position.x,
            y: blockMount.blockMount.position.y,
          },
          size: {
            width: blockMount.blockMount.size.width,
            height: blockMount.blockMount.size.height,
          },
          zOrder: blockMount.blockMount.zOrder.value,
          content: block.metadata.value,
        })),
        edges: edges.map(edgeAgg => {
          // blockId를 blockMountId로 변환 (React Flow 노드 ID 매핑)
          const sourceBlockMountId =
            blockIdToMountIdMap.get(edgeAgg.edge.sourceBlockId.value) ||
            edgeAgg.edge.sourceBlockId.value;
          const targetBlockMountId =
            blockIdToMountIdMap.get(edgeAgg.edge.targetBlockId.value) ||
            edgeAgg.edge.targetBlockId.value;

          return {
            edgeId: edgeAgg.edge.id.value,
            pageId: edgeAgg.edge.pageId.value,
            sourceBlockId: sourceBlockMountId,
            targetBlockId: targetBlockMountId,
            edgeType: edgeAgg.edge.edgeType.value,
            label: edgeAgg.edge.edgeLabel,
            style: edgeAgg.edge.style,
            createdAt: edgeAgg.edge.createdAt.toISOString(),
            updatedAt: edgeAgg.edge.updatedAt.toISOString(),
          };
        }),
        viewport: viewportAggregate
          ? {
              x: viewportAggregate.viewport.centerX,
              y: viewportAggregate.viewport.centerY,
              zoom: viewportAggregate.viewport.zoomLevel,
            }
          : null,
      };

      return Result.success(canvasViewData);
    } catch (error) {
      return Result.error(
        new CanvasManagementError(
          'DATABASE_CONNECTION_FAILED',
          `Failed to load canvas view: ${error}`
        )
      );
    }
  }
}
