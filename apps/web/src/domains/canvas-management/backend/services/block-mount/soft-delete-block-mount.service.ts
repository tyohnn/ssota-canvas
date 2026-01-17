/**
 * 블럭 마운트 삭제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { SoftDeleteBlockMountCommand } from '../../../shared/commands';
import type { SoftDeleteBlockMountRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { MultipleBlockMountsDeletedEvent } from '../../../shared/events';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';
import { deleteConnectedEdges } from '../../services/edge';

/**
 * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
 * Story CM-008 구현
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 블럭 마운트 삭제 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockMountRepository - BlockMount Repository
 * @param edgeRepository - Edge Repository
 * @returns 삭제 결과
 */
export async function softDeleteBlockMount(
  safeDto: SoftDeleteBlockMountRequest,
  safeUserId: UserId,
  blockMountRepository: BlockMountRepository,
  edgeRepository: EdgeRepository
): Promise<
  Result<
    {
      deletedCount: number;
      deletedEdgesCount: number;
      deletedBlockMountIds: BlockMountId[];
    },
    Error
  >
> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIds = safeDto.blockMountIds.map(id => new BlockMountId(id));

    // 2. 다중 BlockMount 조회
    const aggregates = await Promise.all(
      blockMountIds.map(id => blockMountRepository.findById(id))
    );

    // 3. 유효한 블럭 마운트 aggregate들 필터링
    const validAggregates = aggregates.filter(
      (agg): agg is BlockMountAggregate => agg !== null
    );

    if (validAggregates.length === 0) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'No valid block mounts found'
        )
      );
    }

    // 4-7. 각 BlockMount 삭제를 병렬로 처리 (Promise.allSettled 사용)
    const deletionResults = await Promise.allSettled(
      validAggregates.map(async aggregate => {
        // 1. Aggregate에서 deleteBlockMount 호출
        const blockMount = aggregate.getBlockMount();
        const deleteBlockMountCommand: SoftDeleteBlockMountCommand = {
          blockMountId: blockMount.id,
          userId: safeUserId,
        };
        aggregate.deleteBlockMount(deleteBlockMountCommand);

        // 2. 연결된 엣지 삭제
        const deleteEdgesResult = await deleteConnectedEdges(
          blockMount.id,
          safeUserId,
          edgeRepository
        );

        let deletedEdgesCount = 0;
        if (deleteEdgesResult.isSuccess()) {
          deletedEdgesCount = deleteEdgesResult.value;
        } else {
          // 엣지 삭제 실패해도 BlockMount 삭제는 계속 진행
        }

        // 3. BlockMount 삭제
        await blockMountRepository.softDelete(blockMount.id);

        return {
          aggregate,
          deletedEdgesCount,
        };
      })
    );

    // Log rejected errors
    const rejectedResults = deletionResults.filter(
      r => r.status === 'rejected'
    );
    if (rejectedResults.length > 0) {
      console.error(
        '❌ [softDeleteBlockMount] Some deletions failed:',
        rejectedResults.map((r, i) => ({
          index: i,
          reason: (r as PromiseRejectedResult).reason,
        }))
      );
    }

    // 8. 성공한 작업들만 이벤트 처리
    const successfulResults = deletionResults
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          aggregate: BlockMountAggregate;
          deletedEdgesCount: number;
        }> => result.status === 'fulfilled'
      )
      .map(result => result.value);

    const individualEvents = successfulResults.flatMap(result =>
      result.aggregate.getUncommittedEvents()
    );

    // 다중 삭제인 경우 통합 이벤트 추가 (성공한 것들만)
    let allEvents = individualEvents;
    if (successfulResults.length > 1) {
      const totalDeletedEdgesCount = successfulResults.reduce(
        (sum, result) => sum + result.deletedEdgesCount,
        0
      );

      const multipleDeletionsEvent = new MultipleBlockMountsDeletedEvent(
        'batch-delete',
        {
          deletedBlockMountIds: successfulResults.map(
            result => result.aggregate.getBlockMount().id.value
          ),
          deletedEdgesCount: totalDeletedEdgesCount,
          deletedAt: new Date(),
          userId: safeUserId.value,
        },
        new Date()
      );
      allEvents = [...individualEvents, multipleDeletionsEvent];
    }

    await Promise.allSettled(allEvents.map(event => event.handle()));

    // 9. 이벤트 커밋
    successfulResults.forEach(result =>
      result.aggregate.markEventsAsCommitted()
    );

    // 10. Result.success 반환 (성공한 것들만)
    const totalDeletedEdgesCount = successfulResults.reduce(
      (sum, result) => sum + result.deletedEdgesCount,
      0
    );

    return Result.success({
      deletedCount: successfulResults.length,
      deletedEdgesCount: totalDeletedEdgesCount,
      deletedBlockMountIds: successfulResults.map(
        result => result.aggregate.getBlockMount().id
      ),
    });
  } catch (error) {
    console.error(
      '❌ [softDeleteBlockMount] Block mount deletion failed:',
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
