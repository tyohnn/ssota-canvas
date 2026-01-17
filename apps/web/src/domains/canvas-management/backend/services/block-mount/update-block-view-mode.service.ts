/**
 * 블럭 View Mode 업데이트 서비스 로직
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type { UpdateBlockMountViewModeRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { BlockViewMode } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 블럭 View Mode 업데이트
 *
 * @param safeDto - 검증된 블럭 View Mode 업데이트 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockMountRepository - BlockMount Repository
 * @returns 업데이트된 BlockMountAggregate
 */
export async function updateBlockViewMode(
  safeDto: UpdateBlockMountViewModeRequest,
  safeUserId: UserId,
  blockMountRepository: BlockMountRepository
): Promise<Result<BlockMountAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIdVO = new BlockMountId(safeDto.blockMountId);
    const viewModeVO = BlockViewMode.create(safeDto.viewMode);

    // 2. BlockMountRepository.findById() 호출
    const aggregate = await blockMountRepository.findById(blockMountIdVO);

    if (!aggregate) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'Block mount not found'
        )
      );
    }

    // 3. BlockMountAggregate.updateViewMode() 호출
    aggregate.updateViewMode({
      blockMountId: blockMountIdVO,
      viewMode: viewModeVO,
      userId: safeUserId,
    });

    // 4. 배치 저장 (트랜잭션)
    await blockMountRepository.update(aggregate.getBlockMount());

    // 5. 도메인 이벤트 처리 (현재는 이벤트 없음)
    const individualEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(individualEvents.map(event => event.handle()));

    // 6. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 7. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    console.error(
      '❌ [updateBlockViewMode] Block view mode update failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'VIEW_MODE_UPDATE_FAILED',
        `Failed to update block view mode: ${error}`
      )
    );
  }
}
