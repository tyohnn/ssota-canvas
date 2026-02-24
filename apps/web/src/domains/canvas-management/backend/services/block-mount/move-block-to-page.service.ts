/**
 * 블럭 페이지 이동 서비스 로직
 */
import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { MoveBlockToPageCommand } from '../../../shared/commands';
import type { MoveBlockToPageRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { Position } from '../../../shared/value-objects/position.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

export type MoveBlockToPageParams = {
  safeDto: MoveBlockToPageRequest;
  safeUserId: UserId;
  safeBlockMountAggregate: BlockMountAggregate;
  blockMountRepository: BlockMountRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

/**
 * 블럭 페이지 이동
 *
 * @param params - safeDto, safeUserId, safeBlockMountAggregate, blockMountRepository, eventLogPolicyContext
 * @returns 이동된 BlockMountAggregate
 */
export async function moveBlockToPage(
  params: MoveBlockToPageParams
): Promise<Result<BlockMountAggregate, Error>> {
  const {
    safeDto,
    safeUserId,
    safeBlockMountAggregate: originalAggregate,
    blockMountRepository,
    eventLogPolicyContext,
  } = params;
  try {
    const targetPageIdVO = new PageId(safeDto.targetPageId);

    // 대상 페이지의 모든 블록 조회
    const targetPageBlocks =
      await blockMountRepository.findByPageId(targetPageIdVO);

    // 4. 가장 우측 블록 찾기
    let newPosition: Position;
    if (targetPageBlocks.length === 0) {
      // 페이지가 비어있으면 중앙 배치
      newPosition = new Position(0, 0);
    } else {
      // 가장 우측 블록의 오른쪽에 배치
      const rightmostBlock = targetPageBlocks.reduce((rightmost, block) => {
        const blockMount = block.getBlockMount();
        const rightEdge = blockMount.position.x + blockMount.size.width;
        const currentRightEdge =
          rightmost.getBlockMount().position.x +
          rightmost.getBlockMount().size.width;
        return rightEdge > currentRightEdge ? block : rightmost;
      });

      const rightmostBlockMount = rightmostBlock.getBlockMount();
      newPosition = new Position(
        rightmostBlockMount.position.x + rightmostBlockMount.size.width + 50, // 50px 간격
        rightmostBlockMount.position.y // 같은 Y 위치
      );
    }

    const blockMountIdVO = originalAggregate.getBlockMount().id;

    // 5. BlockMount 이동 (Command 생성 및 실행)
    const moveCommand: MoveBlockToPageCommand = {
      blockMountId: blockMountIdVO,
      targetPageId: targetPageIdVO,
      newPosition,
      userId: safeUserId,
    };
    originalAggregate.moveToPage(moveCommand);

    // 6. Repository 저장
    await blockMountRepository.update(originalAggregate.getBlockMount());

    // 7. 도메인 이벤트 처리
    const events = originalAggregate.getUncommittedEvents();
    await Promise.allSettled(
      events.map((event) => event.handle(eventLogPolicyContext))
    );

    // 8. 이벤트 커밋
    originalAggregate.markEventsAsCommitted();

    return Result.success(originalAggregate);
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOVE_FAILED',
        `Failed to move block to page: ${error instanceof Error ? error.message : error}`
      )
    );
  }
}
