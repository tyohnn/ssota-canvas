/**
 * 블럭 페이지 이동 서비스 로직
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import { MoveBlockToPageCommand } from '@/domains/canvas-management/shared/commands';
import type { MoveBlockToPageRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError, handleDomainEvents } from './common';

/**
 * 블럭 페이지 이동
 * Story E010-009 구현
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 페이지 이동 요청 (SafeDTO)
 * @param blockMountRepository - BlockMount Repository
 * @returns 이동된 BlockMountAggregate
 */
export async function moveBlockToPage(
  safeDto: MoveBlockToPageRequest & {
    userId: string;
  },
  blockMountRepository: BlockMountRepository
): Promise<Result<BlockMountAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIdVO = new BlockMountId(safeDto.blockMountId);
    const targetPageIdVO = new PageId(safeDto.targetPageId);
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

    // 3. 대상 페이지의 모든 블록 조회
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

    // 5. BlockMount 이동 (Command 생성 및 실행)
    const moveCommand: MoveBlockToPageCommand = {
      blockMountId: blockMountIdVO,
      targetPageId: targetPageIdVO,
      newPosition,
      userId: userIdVO,
    };
    originalAggregate.moveToPage(moveCommand);

    // 6. Repository 저장
    await blockMountRepository.update(originalAggregate.getBlockMount());

    // 7. 도메인 이벤트 발행
    const events = originalAggregate.getUncommittedEvents();
    await handleDomainEvents(events);

    // 8. 이벤트 커밋
    originalAggregate.markEventsAsCommitted();

    return Result.success(originalAggregate);
  } catch (error) {
    console.error('❌ [moveBlockToPage] Block move to page failed:', error);
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOVE_FAILED',
        `Failed to move block to page: ${error}`
      )
    );
  }
}
