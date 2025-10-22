// apps/web/src/domains/canvas-management/backend/services/canvas-edge.service.ts

import { Result } from '@/utils/result';
import type { CanvasEdgeService } from './interfaces/canvas-edge.service.interface';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import {
  CreateEdgeCommand,
  UpdateEdgeTypeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeStyleCommand,
  DeleteEdgeCommand,
} from '../../shared/commands/index';
import { EdgeAggregate } from '../../shared/aggregates/edge.aggregate';
import { EdgeId } from '../../shared/value-objects/edge-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

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
 * Default Canvas Edge Service
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당
 */
export class DefaultCanvasEdgeService implements CanvasEdgeService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

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
        command.edgeType
      );

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge creation failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_CREATION_FAILED',
          `Failed to create edge: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 타입 업데이트
   */
  async updateEdgeType(
    command: UpdateEdgeTypeCommand
  ): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. EdgeRepository.findById() 호출
      const aggregate = await this.edgeRepository.findById(command.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. EdgeAggregate.updateEdgeType() 호출
      aggregate.updateEdgeType(command.newType);

      // 3. EdgeRepository.save() 호출
      await this.edgeRepository.save(aggregate);

      // 4. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge type update failed:', error);
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
      console.error('❌ [CanvasEdgeService] Edge label update failed:', error);
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
      console.error('❌ [CanvasEdgeService] Edge style update failed:', error);
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
      console.error('❌ [CanvasEdgeService] Edge deletion failed:', error);
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
        '❌ [CanvasEdgeService] Connected edges deletion failed:',
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
}
