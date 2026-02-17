/**
 * 블럭 크기 업데이트 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type { UpdateBlockSizeRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockViewMode } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

export type UpdateBlockSizeParams = {
  safeDto: UpdateBlockSizeRequest;
  safeUserId: UserId;
  safeBlockMountAggregate: BlockMountAggregate;
  blockMountRepository: BlockMountRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 크기 업데이트
 *
 * @param params - safeDto, safeUserId, safeBlockMountAggregate, blockMountRepository, eventLogPolicyContext
 * @returns 업데이트된 BlockMountAggregate
 */
export async function updateBlockSize(
  params: UpdateBlockSizeParams
): Promise<Result<BlockMountAggregate, Error>> {
  const {
    safeDto,
    safeUserId,
    safeBlockMountAggregate: aggregate,
    blockMountRepository,
    eventLogPolicyContext,
  } = params;
  try {
    const sizeVO = new Size(safeDto.newSize.width, safeDto.newSize.height);

    // 3. viewMode 결정: safeDto에 viewMode가 제공되면 사용, 없으면 현재 BlockMount의 viewMode 사용
    const blockMount = aggregate.getBlockMount();
    const viewMode =
      safeDto.viewMode !== undefined
        ? BlockViewMode.create(safeDto.viewMode)
        : blockMount.viewMode;

    // 4. BlockMountAggregate.updateBlockSize() 호출 (Command 전달)
    aggregate.updateBlockSize({
      newSize: sizeVO,
      viewMode,
      userId: safeUserId,
    });

    // 5. 배치 저장 (트랜잭션)
    await blockMountRepository.update(aggregate.getBlockMount());

    // 6. 도메인 이벤트 처리
    const individualEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(
      individualEvents.map(event => event.handle(eventLogPolicyContext))
    );

    // 7. 이벤트 커밋
    aggregate.markEventsAsCommitted();

    // 8. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    console.error('❌ [updateBlockSize] Block size update failed:', error);
    return Result.error(
      new CanvasManagementError(
        'SIZE_UPDATE_FAILED',
        `Failed to update block size: ${error}`
      )
    );
  }
}
