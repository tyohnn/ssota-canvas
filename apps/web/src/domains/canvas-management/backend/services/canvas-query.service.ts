// apps/web/src/domains/canvas-management/backend/services/canvas-query.service.ts
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';

import type { CanvasViewData } from '../../shared/dtos';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import type { ViewportRepository } from '../repositories/interfaces/viewport.repository.interface';
import type { ICanvasQueryService } from './interfaces/canvas-query.service.interface';

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
 * Canvas Query Service
 *
 * 캔버스 데이터 조회를 담당하는 서비스 구현 (Read Model 패턴, Drizzle ORM 사용)
 */
export class CanvasQueryService implements ICanvasQueryService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository
  ) { }

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

      // 4. 모든 데이터 조합하여 CanvasViewData 생성
      // ⚠️ Schema Change: edges now use block_mount_id directly (no mapping needed)
      const canvasViewData: CanvasViewData = {
        pageId: pageId.value,
        blocks: blockMountsWithBlocks.map(
          ({ blockMountAggregate, blockAggregate }) => {
            if (!blockMountAggregate || !blockAggregate) {
              console.error(
                '[CanvasQueryService] Invalid block mount or block aggregate:',
                { blockMountAggregate, blockAggregate }
              );
              throw new Error('Invalid block mount or block aggregate');
            }

            const blockMount = blockMountAggregate.getBlockMount();
            const block = blockAggregate.getBlock();

            if (!blockMount || !block) {
              console.error(
                '[CanvasQueryService] Invalid block mount or block:',
                { blockMount, block }
              );
              throw new Error('Invalid block mount or block');
            }

            // properties.toJSON()과 _extraFields(커스텀 속성 값) 병합
            const propertiesJSON = block.properties.toJSON();
            const extraFields = (block.properties as any)._extraFields || {};
            const fullProperties = {
              ...propertiesJSON,
              ...extraFields,
            };

            return {
              blockMountId: blockMount.id.value,
              blockId: block.id.value, // ✅ blocks.id 직접 사용
              blockType: block.blockType.value,
              title: block.title,
              properties: fullProperties,
              customProperties:
                block.customProperties.map(cp => cp.toJSON()) || [],
              content: block.content, // JSONB content
              position: {
                x: blockMount.position.x,
                y: blockMount.position.y,
              },
              size: {
                width: blockMount.size.width,
                height: blockMount.size.height,
              },
              zOrder: blockMount.zOrder.value,
              viewMode: blockMount.viewMode.value,
              viewModeSizes: blockMount.viewModeSizes.toJSON(),
              createdAt: block.createdAt.toISOString(),
              updatedAt: block.updatedAt.toISOString(),
              createdByProfile: block.createdByProfile,
            };
          }
        ),
        edges: edges.map(edgeAgg => {
          if (!edgeAgg || !edgeAgg.edge) {
            console.error(
              '[CanvasQueryService] Invalid edge aggregate:',
              edgeAgg
            );
            throw new Error('Invalid edge aggregate');
          }

          const edge = edgeAgg.edge;

          if (
            !edge.id ||
            !edge.pageId ||
            !edge.sourceBlockMountId ||
            !edge.targetBlockMountId ||
            !edge.edgeShape
          ) {
            console.error('[CanvasQueryService] Invalid edge data:', {
              hasId: !!edge.id,
              hasPageId: !!edge.pageId,
              hasSourceBlockMountId: !!edge.sourceBlockMountId,
              hasTargetBlockMountId: !!edge.targetBlockMountId,
              hasEdgeShape: !!edge.edgeShape,
              edge,
            });
            throw new Error('Invalid edge data: missing required fields');
          }

          return {
            edgeId: edge.id.value,
            pageId: edge.pageId.value,
            sourceBlockMountId: edge.sourceBlockMountId.value, // ✅ 직접 사용 (이미 blockMountId)
            targetBlockMountId: edge.targetBlockMountId.value, // ✅ 직접 사용 (이미 blockMountId)
            sourceHandle: edge.sourceHandle.value,
            targetHandle: edge.targetHandle.value,
            edgeShape: edge.edgeShape.value,
            label: edge.edgeLabel || '',
            style: edge.style,
            createdAt: edge.createdAt.toISOString(),
            updatedAt: edge.updatedAt.toISOString(),
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
