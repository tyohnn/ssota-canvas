// apps/web/src/domains/canvas-management/backend/services/canvas-block-mount.service.ts

import { Result } from '@/utils/result';
import type { CanvasBlockMountService } from './interfaces/canvas-block-mount.service.interface';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import type { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import {
  CreateAndMountBlockCommand,
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  UpdateMultipleBlockPositionsCommand,
  DeleteBlockMountCommand,
  DeleteMultipleBlockMountsCommand,
} from '../../shared/commands/index';
import { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';

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
 * Default Canvas Block Mount Service
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당
 */
export class DefaultCanvasBlockMountService implements CanvasBlockMountService {
  constructor(
    private blockManagementService: BlockManagementService,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

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
          '❌ [CanvasBlockMountService] Block creation failed:',
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
          '❌ [CanvasBlockMountService] Failed to save block mount:',
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
        '💥 [CanvasBlockMountService] Block creation and mounting failed:',
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
        '❌ [CanvasBlockMountService] Block position update failed:',
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
        '❌ [CanvasBlockMountService] Block size update failed:',
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
            `⚠️ [CanvasBlockMountService] Block mount not found: ${command.blockPositions[i]!.blockMountId}`
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
        '❌ [CanvasBlockMountService] Multiple block positions update failed:',
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
        '❌ [CanvasBlockMountService] Block mount deletion failed:',
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
            `⚠️ [CanvasBlockMountService] Failed to delete block mount: ${blockMountId.value}`,
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
        '❌ [CanvasBlockMountService] Multiple block mounts deletion failed:',
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
}
