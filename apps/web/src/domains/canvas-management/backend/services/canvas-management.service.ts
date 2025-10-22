import { Result } from '@/utils/result';
import { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import {
  CreateAndMountBlockCommand,
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  UpdateMultipleBlockPositionsCommand,
  CreateEdgeCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeStyleCommand,
  DeleteEdgeCommand,
  DeleteBlockMountCommand,
  DeleteMultipleBlockMountsCommand,
  DuplicateBlockCommand,
} from '../../shared/commands/index';
import { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { EdgeAggregate } from '../../shared/aggregates/edge.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';
import { EdgeId } from '../../shared/value-objects/edge-id.vo';
import { EdgeShape } from '../../shared/value-objects/edge-shape.vo';
import { CanvasViewData } from '../../shared/dtos';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import { ViewportRepository } from '../repositories/interfaces/viewport.repository.interface';
import { WorkspaceRepository } from '@/domains/workspace-management/backend/repositories/interfaces/workspace.repository.interface';

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

export class CanvasManagementService {
  constructor(
    private blockManagementService: BlockManagementService,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository,
    private viewportRepository: ViewportRepository,
    private workspaceRepository: WorkspaceRepository
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
            edgeShape: edgeAgg.edge.edgeShape.value,
            label: edgeAgg.edge.edgeLabel,
            style: {
              stroke: edgeAgg.edge.edgeStyle.color,
              strokeWidth: edgeAgg.edge.edgeStyle.thickness,
            },
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

  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   * Block Management Service를 사용하여 블럭 생성 후 마운트
   */
  async createAndMountBlock(
    command: CreateAndMountBlockCommand
  ): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. Block Management Service를 통해 블럭 생성
      const blockCreationResult = await this.blockManagementService.createBlock(
        {
          blockType: command.blockType,
          workspaceId: command.workspaceId,
          metadata: command.metadata,
          userId: command.userId,
        }
      );

      if (blockCreationResult.isError()) {
        console.error(
          '❌ [CanvasManagementService] Block creation failed:',
          blockCreationResult.error
        );
        return Result.error(blockCreationResult.error);
      }

      const createdBlock = blockCreationResult.value;

      // 2. 생성된 블럭 ID로 BlockMountAggregate 생성
      const blockIdVO = new BlockId(createdBlock.id);
      const blockMountId = new BlockMountId(crypto.randomUUID());
      const aggregate = BlockMountAggregate.mountBlock(
        blockMountId,
        command.pageId,
        blockIdVO,
        command.position,
        command.size
      );

      // 3. BlockMountRepository에 저장
      try {
        await this.blockMountRepository.save(aggregate);
      } catch (saveError) {
        console.error(
          '❌ [CanvasManagementService] Failed to save block mount:',
          saveError
        );
        return Result.error(
          saveError instanceof Error
            ? saveError
            : new Error('Failed to save block mount')
        );
      }
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '💥 [CanvasManagementService] Block creation and mounting failed:',
        error
      );
      return Result.error(new Error('Block creation and mounting failed'));
    }
  }

  /**
   * 블럭 위치 업데이트
   */
  async updateBlockPosition(
    command: UpdateBlockPositionCommand
  ): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. BlockMountRepository.findById() 호출
      const aggregate = await this.blockMountRepository.findById(
        command.blockMountId
      );

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. BlockMountAggregate.updateBlockPosition() 호출
      aggregate.updateBlockPosition(command.newPosition);

      // 3. BlockMountRepository.save() 호출
      await this.blockMountRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Block position update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'POSITION_UPDATE_FAILED',
          `Failed to update block position: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 크기 업데이트
   */
  async updateBlockSize(
    command: UpdateBlockSizeCommand
  ): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. BlockMountRepository.findById() 호출
      const aggregate = await this.blockMountRepository.findById(
        command.blockMountId
      );

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. BlockMountAggregate.updateBlockSize() 호출
      aggregate.updateBlockSize(command.newSize);

      // 3. BlockMountRepository.save() 호출
      await this.blockMountRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Block size update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'SIZE_UPDATE_FAILED',
          `Failed to update block size: ${error}`
        )
      );
    }
  }

  /**
   * 다중 블럭 위치 일괄 업데이트 (정렬/분포용)
   */
  async updateMultipleBlockPositions(
    command: UpdateMultipleBlockPositionsCommand
  ): Promise<Result<void, Error>> {
    try {
      // 1. 다중 BlockMount 조회
      const aggregates = await Promise.all(
        command.blockPositions.map(bp =>
          this.blockMountRepository.findById(bp.blockMountId)
        )
      );

      // 2. 각 블럭 위치 업데이트
      for (let i = 0; i < aggregates.length; i++) {
        const aggregate = aggregates[i];
        const position = command.blockPositions[i]!.position;

        if (!aggregate) {
          console.warn(
            `⚠️ [CanvasManagementService] Block mount not found: ${command.blockPositions[i]!.blockMountId}`
          );
          continue;
        }

        aggregate.updateBlockPosition(position);
      }

      // 3. 배치 저장 (트랜잭션)
      await Promise.all(
        aggregates
          .filter((agg): agg is BlockMountAggregate => agg !== null)
          .map(agg => this.blockMountRepository.save(agg))
      );

      // 4. Result.success() 반환
      return Result.success(undefined);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Multiple block positions update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'MULTIPLE_POSITIONS_UPDATE_FAILED',
          `Failed to update multiple block positions: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 생성
   */
  async createEdge(
    command: CreateEdgeCommand
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 소스/타겟 블럭이 같은 페이지에 마운트되어 있는지 확인
      const pageBlockMounts = await this.blockMountRepository.findByPageId(
        command.pageId
      );

      const sourceExists = pageBlockMounts.some(bm =>
        bm.blockMount.blockId.equals(command.sourceBlockId)
      );
      const targetExists = pageBlockMounts.some(bm =>
        bm.blockMount.blockId.equals(command.targetBlockId)
      );

      if (!sourceExists || !targetExists) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_NOT_FOUND',
            'Source or target block not found on this page'
          )
        );
      }

      // 2. EdgeAggregate.createEdge() 호출
      const edgeId = EdgeId.generate();
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        command.pageId,
        command.sourceBlockId,
        command.targetBlockId,
        command.edgeShape
      );

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Edge creation failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'EDGE_CREATION_FAILED',
          `Failed to create edge: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 모양 업데이트
   */
  async updateEdgeShape(
    command: UpdateEdgeShapeCommand
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. EdgeRepository.findById() 호출
      const aggregate = await this.edgeRepository.findById(command.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. EdgeAggregate.updateEdgeShape() 호출
      aggregate.updateEdgeShape(command.newShape);

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Edge type update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'EDGE_TYPE_UPDATE_FAILED',
          `Failed to update edge type: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 레이블 업데이트
   */
  async updateEdgeLabel(
    command: UpdateEdgeLabelCommand
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. EdgeRepository.findById() 호출
      const aggregate = await this.edgeRepository.findById(command.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. EdgeAggregate.updateEdgeLabel() 호출
      aggregate.updateEdgeLabel(command.newLabel);

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Edge label update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'EDGE_LABEL_UPDATE_FAILED',
          `Failed to update edge label: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 스타일 업데이트
   */
  async updateEdgeStyle(
    command: UpdateEdgeStyleCommand
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. EdgeRepository.findById() 호출
      const aggregate = await this.edgeRepository.findById(command.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. EdgeAggregate.updateEdgeStyle() 호출
      aggregate.updateEdgeStyle(command.style);

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Edge style update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'EDGE_STYLE_UPDATE_FAILED',
          `Failed to update edge style: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 삭제
   */
  async deleteEdge(command: DeleteEdgeCommand): Promise<Result<void, Error>> {
    try {
      // 1. EdgeRepository.findById() 호출
      const aggregate = await this.edgeRepository.findById(command.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. EdgeAggregate.deleteEdge() 호출 (이벤트 발행)
      aggregate.deleteEdge();

      // 3. EdgeRepository.delete() 호출
      await this.edgeRepository.delete(command.edgeId);

      // 4. Result.success() 반환
      return Result.success(undefined);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Edge deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'EDGE_DELETION_FAILED',
          `Failed to delete edge: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 삭제 시 연결된 엣지 모두 삭제
   */
  async deleteConnectedEdges(blockId: BlockId): Promise<Result<void, Error>> {
    try {
      // 1. EdgeRepository.findByConnectedBlockId() 호출
      const connectedEdges =
        await this.edgeRepository.findByConnectedBlockId(blockId);

      if (connectedEdges.length === 0) {
        return Result.success(undefined);
      }

      // 2. 모든 엣지 삭제 이벤트 발행
      connectedEdges.forEach(aggregate => aggregate.deleteEdge());

      // 3. EdgeRepository.deleteAll() 호출
      const edgeIds = connectedEdges.map(agg => agg.edge.id);
      await this.edgeRepository.deleteAll(edgeIds);

      // 4. Result.success() 반환
      return Result.success(undefined);
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Connected edges deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'CONNECTED_EDGES_DELETION_FAILED',
          `Failed to delete connected edges: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 마운트 삭제 (연결된 엣지 자동 정리)
   * Story CM-008 구현
   */
  async deleteBlockMount(
    command: DeleteBlockMountCommand
  ): Promise<Result<{ deletedEdgesCount: number }, Error>> {
    try {
      // 1. BlockMountRepository.findById() 호출
      const aggregate = await this.blockMountRepository.findById(
        command.blockMountId
      );

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. BlockMountAggregate.deleteBlockMount() 호출
      aggregate.deleteBlockMount();

      // 3. 연결된 엣지 조회 및 삭제
      const connectedEdges = await this.edgeRepository.findByConnectedBlockId(
        aggregate.blockMount.blockId
      );

      const edgeIds = connectedEdges.map(edgeAgg => edgeAgg.edge.id);
      const deletedEdgesCount = edgeIds.length;

      // 4. 엣지 일괄 삭제
      if (edgeIds.length > 0) {
        await this.edgeRepository.deleteAll(edgeIds);
      }

      // 5. BlockMountRepository.delete() 호출
      await this.blockMountRepository.delete(command.blockMountId);

      // 6. Result.success(deletedEdgesCount) 반환
      return Result.success({ deletedEdgesCount });
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Block mount deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_DELETION_FAILED',
          `Failed to delete block mount: ${error}`
        )
      );
    }
  }

  /**
   * 다중 블럭 마운트 삭제 (연결된 엣지 자동 정리)
   * Story CM-008 구현 - 다중 블럭 삭제
   */
  async deleteMultipleBlockMounts(
    command: DeleteMultipleBlockMountsCommand
  ): Promise<
    Result<{ deletedCount: number; deletedEdgesCount: number }, Error>
  > {
    try {
      let deletedCount = 0;
      let totalDeletedEdgesCount = 0;

      // 1. 각 BlockMount 삭제
      for (const blockMountId of command.blockMountIds) {
        const result = await this.deleteBlockMount({
          blockMountId,
          userId: command.userId,
        });

        if (result.isSuccess()) {
          deletedCount++;
          totalDeletedEdgesCount += result.value.deletedEdgesCount;
        } else {
          console.warn(
            `⚠️ [CanvasManagementService] Failed to delete block mount: ${blockMountId.value}`,
            result.error
          );
        }
      }

      // 2. Result.success() 반환
      return Result.success({
        deletedCount,
        deletedEdgesCount: totalDeletedEdgesCount,
      });
    } catch (error) {
      console.error(
        '❌ [CanvasManagementService] Multiple block mounts deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'MULTIPLE_BLOCK_MOUNTS_DELETION_FAILED',
          `Failed to delete multiple block mounts: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 복제 (Block Management Service와 연동)
   * Story CM-010 구현
   */
  async duplicateBlock(
    command: DuplicateBlockCommand
  ): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. 원본 BlockMount 조회
      const originalAggregate = await this.blockMountRepository.findById(
        command.blockMountId
      );

      if (!originalAggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. Block Management Service를 통해 블럭 복제

      const blockDuplicationResult =
        await this.blockManagementService.duplicateBlock({
          originalBlockId: originalAggregate.blockMount.blockId,
          workspaceId: command.workspaceId,
          userId: command.userId,
        });

      if (blockDuplicationResult.isError()) {
        return Result.error(blockDuplicationResult.error);
      }

      const duplicatedBlock = blockDuplicationResult.value;
      const duplicatedBlockId = new BlockId(duplicatedBlock.id);

      // 3. BlockMountAggregate.duplicateBlock() 호출
      const duplicatedAggregate = originalAggregate.duplicateBlock(
        duplicatedBlockId,
        command.offsetX || 20,
        command.offsetY || 20
      );

      // 4. BlockMountRepository에 저장
      try {
        await this.blockMountRepository.save(duplicatedAggregate);
      } catch (saveError) {
        return Result.error(
          saveError instanceof Error
            ? saveError
            : new Error('Failed to save duplicated block mount')
        );
      }

      return Result.success(duplicatedAggregate);
    } catch (error) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_DUPLICATION_FAILED',
          `Failed to duplicate block: ${error}`
        )
      );
    }
  }
}
