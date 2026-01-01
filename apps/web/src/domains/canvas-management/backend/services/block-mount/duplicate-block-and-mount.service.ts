/**
 * 블럭 복제 및 마운트 서비스 로직
 */
import type { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import { DuplicateBlockMountCommand } from '@/domains/canvas-management/shared/commands';
import type { DuplicateBlockAndMountRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError, handleDomainEvents } from './common';

/**
 * 블럭 복제 (Block Management Service와 연동)
 * Story CM-010 구현
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 복제 요청 (SafeDTO)
 * @param blockManagementService - Block Management Service
 * @param blockMountRepository - BlockMount Repository
 * @returns 복제된 BlockMountAggregate와 BlockAggregate
 */
export async function duplicateBlockAndMount(
  safeDto: DuplicateBlockAndMountRequest & {
    userId: string;
    workspaceId: string;
  },
  blockManagementService: BlockManagementService,
  blockMountRepository: BlockMountRepository
): Promise<
  Result<
    {
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    },
    Error
  >
> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIdVO = new BlockMountId(safeDto.blockMountId);
    const workspaceIdVO = new WorkspaceId(safeDto.workspaceId);
    const userIdVO = new UserId(safeDto.userId);

    // 2. 원본 BlockMount 조회
    const originalAggregate =
      await blockMountRepository.findById(blockMountIdVO);

    if (!originalAggregate) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'Block mount not found'
        )
      );
    }

    // 3. Block Management Service를 통해 블럭 복제
    const duplicatedBlock = await blockManagementService.duplicateBlock({
      originalBlockId: originalAggregate.getBlockMount().blockId,
      workspaceId: workspaceIdVO,
      userId: userIdVO,
    });

    // 4. BlockAggregate 재구성
    const blockAggregate = BlockAggregate.reconstitute(duplicatedBlock);

    // 5. BlockMountAggregate.duplicateBlock() 호출
    const duplicateBlockMountCommand: DuplicateBlockMountCommand = {
      newBlockId: duplicatedBlock.id,
      originalBlockMount: originalAggregate.getBlockMount(),
      offsetX: safeDto.offsetX || 20,
      offsetY: safeDto.offsetY || 20,
    };
    const duplicatedAggregate = originalAggregate.duplicateBlockMount(
      duplicateBlockMountCommand
    );

    // 6. BlockMountRepository에 저장
    try {
      await blockMountRepository.create(duplicatedAggregate.getBlockMount());
    } catch (saveError) {
      return Result.error(
        saveError instanceof Error
          ? saveError
          : new Error('Failed to save duplicated block mount')
      );
    }

    // 7. 이벤트 핸들러 실행 (Canvas Management 도메인 내부)
    const events = duplicatedAggregate.getUncommittedEvents();
    await handleDomainEvents(events);

    // 8. 이벤트 커밋
    duplicatedAggregate.markEventsAsCommitted();

    return Result.success({
      blockMountAggregate: duplicatedAggregate,
      blockAggregate,
    });
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error}`
      )
    );
  }
}
