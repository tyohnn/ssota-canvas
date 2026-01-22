/**
 * 블럭 복제 및 마운트 서비스 로직
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { duplicateBlock } from '@/domains/block-management/backend/services/block';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import type { DuplicateBlockRequest } from '@/domains/block-management/shared/dtos/requests/block.requests';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { DuplicateBlockMountCommand } from '../../../shared/commands';
import type { DuplicateBlockAndMountRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

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
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param safeWorkspaceId - 검증된 워크스페이스 ID (권한 검증됨)
 * @param blockRepository - Block Repository
 * @param blockMountRepository - BlockMount Repository
 * @returns 복제된 BlockMountAggregate와 BlockAggregate
 */
export async function duplicateBlockAndMount(
  safeDto: DuplicateBlockAndMountRequest,
  safeUserId: UserId,
  safeWorkspaceId: WorkspaceId,
  blockRepository: IBlockRepository,
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

    // 3. Block Management Service Function을 통해 블럭 복제
    const duplicateBlockRequest: DuplicateBlockRequest = {
      workspaceId: safeWorkspaceId.value,
      blockId: originalAggregate.getBlockMount().blockId.value,
    };
    const duplicateResult = await duplicateBlock(
      duplicateBlockRequest,
      safeUserId,
      blockRepository
    );
    if (duplicateResult.isError()) {
      return Result.error(duplicateResult.error);
    }
    const duplicatedBlock = duplicateResult.value;

    let events = originalAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    originalAggregate.markEventsAsCommitted();

    // 4. BlockAggregate 재구성
    const blockAggregate = BlockAggregate.reconstitute(duplicatedBlock);

    // 5. BlockMountAggregate.duplicateBlock() 호출
    const duplicateBlockMountCommand: DuplicateBlockMountCommand = {
      newBlockId: duplicatedBlock.id,
      originalBlockMount: originalAggregate.getBlockMount(),
      offsetX: safeDto.offsetX || 20,
      offsetY: safeDto.offsetY || 20,
      userId: safeUserId,
    };
    const duplicatedAggregate = originalAggregate.duplicateBlockMount(
      duplicateBlockMountCommand
    );

    // 6. BlockMountRepository에 저장
    try {
      await blockMountRepository.create(duplicatedAggregate.getBlockMount());
    } catch (saveError) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_DUPLICATION_FAILED',
          `Failed to save duplicated block mount: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
          { originalError: saveError }
        )
      );
    }

    // 7. 도메인 이벤트 처리
    events = duplicatedAggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

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
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      )
    );
  }
}
