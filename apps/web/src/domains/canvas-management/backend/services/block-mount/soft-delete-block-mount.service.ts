/**
 * 블럭 마운트 삭제 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import {
  SoftDeleteBlockMountCommand,
  type DeleteEdgeCommand,
} from '../../../shared/commands';
import type { SoftDeleteBlockMountRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { MultipleBlockMountsDeletedEvent } from '../../../shared/events';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';

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
 * ✅ Bulk: 엣지 한 번 조회·삭제, 블록 한 번 softDeleteMany
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

    // 이미 삭제되었거나 없는 ID만 있는 경우 멱등 처리 (이중 호출/중복 요청 시 에러 방지)
    if (validAggregates.length === 0) {
      return Result.success({
        deletedCount: 0,
        deletedEdgesCount: 0,
        deletedBlockMountIds: [],
      });
    }

    // 4. 삭제하는 block mounts 들에 연결된 모든 엣지 한 번에 조회 (bulk)
    const connectedEdges =
      await edgeRepository.findByConnectedBlockMountIds(blockMountIds);

    // 5. 엣지 aggregate별 deleteEdge command (이벤트는 아직 처리하지 않음)
    for (const edgeAggregate of connectedEdges) {
      const command: DeleteEdgeCommand = {
        edgeId: edgeAggregate.edge.id,
        userId: safeUserId,
      };
      edgeAggregate.deleteEdge(command);
    }

    // 6. 엣지 한 번에 삭제 (bulk) — DB 반영 먼저
    if (connectedEdges.length > 0) {
      const edgeIds = connectedEdges.map(agg => agg.edge.id);
      await edgeRepository.deleteAll(edgeIds);
    }

    // 7. 엣지 삭제 반영 후 도메인 이벤트 처리
    for (const edgeAggregate of connectedEdges) {
      const events = edgeAggregate.getUncommittedEvents();
      await Promise.allSettled(events.map(event => event.handle()));
      edgeAggregate.markEventsAsCommitted();
    }

    // 8. BlockMount aggregate별 deleteBlockMount (이벤트 발행용, 아직 처리하지 않음)
    for (const aggregate of validAggregates) {
      const blockMount = aggregate.getBlockMount();
      const deleteBlockMountCommand: SoftDeleteBlockMountCommand = {
        blockMountId: blockMount.id,
        userId: safeUserId,
      };
      aggregate.deleteBlockMount(deleteBlockMountCommand);
    }

    // 9. 블럭 마운트 한 번에 삭제 (bulk) — DB 반영 먼저
    const validBlockMountIds = validAggregates.map(
      agg => agg.getBlockMount().id
    );
    await blockMountRepository.softDeleteMany(validBlockMountIds);

    // 10. 블럭 삭제 반영 후 도메인 이벤트 처리
    const individualEvents = validAggregates.flatMap(agg =>
      agg.getUncommittedEvents()
    );
    let allEvents = individualEvents;
    if (validAggregates.length > 1) {
      const multipleDeletionsEvent = new MultipleBlockMountsDeletedEvent(
        'batch-delete',
        {
          deletedBlockMountIds: validAggregates.map(
            agg => agg.getBlockMount().id.value
          ),
          deletedEdgesCount: connectedEdges.length,
          deletedAt: new Date(),
          userId: safeUserId.value,
        },
        new Date()
      );
      allEvents = [...individualEvents, multipleDeletionsEvent];
    }
    await Promise.allSettled(allEvents.map(event => event.handle()));

    // 11. 이벤트 커밋
    validAggregates.forEach(agg => agg.markEventsAsCommitted());

    return Result.success({
      deletedCount: validAggregates.length,
      deletedEdgesCount: connectedEdges.length,
      deletedBlockMountIds: validBlockMountIds,
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
