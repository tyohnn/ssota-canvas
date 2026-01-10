/**
 * 블럭 크기 업데이트 서비스 로직
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type { UpdateBlockSizeRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { BlockViewMode } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 블럭 크기 업데이트
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 크기 업데이트 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockMountRepository - BlockMount Repository
 * @returns 업데이트된 BlockMountAggregate
 */
export async function updateBlockSize(
  safeDto: UpdateBlockSizeRequest,
  safeUserId: UserId,
  blockMountRepository: BlockMountRepository
): Promise<Result<BlockMountAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIdVO = new BlockMountId(safeDto.blockMountId);
    const sizeVO = new Size(safeDto.newSize.width, safeDto.newSize.height);

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
    await Promise.allSettled(individualEvents.map(event => event.handle()));

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
