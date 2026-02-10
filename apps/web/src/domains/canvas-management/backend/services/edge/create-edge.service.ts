/**
 * Edge 생성 서비스 로직
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { CreateEdgeCommand } from '@/domains/canvas-management/shared/commands';
import type { CreateEdgeRequest } from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { EdgeHandle } from '@/domains/canvas-management/shared/value-objects/edge-handle.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

/**
 * 엣지 생성
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환 (Value Objects 생성)
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 *
 * @param safeDto - 검증된 엣지 생성 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockMountRepository - BlockMount Repository
 * @param edgeRepository - Edge Repository
 * @returns 생성된 엣지 Aggregate
 */
export async function createEdge(
  safeDto: CreateEdgeRequest,
  safeUserId: UserId,
  blockMountRepository: BlockMountRepository,
  edgeRepository: EdgeRepository
): Promise<Result<EdgeAggregate, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const pageId = new PageId(safeDto.pageId);
    const sourceBlockMountId = new BlockMountId(safeDto.sourceBlockMountId);
    const targetBlockMountId = new BlockMountId(safeDto.targetBlockMountId);

    const sourceHandle = EdgeHandle.fromString(safeDto.sourceHandle);
    const targetHandle = EdgeHandle.fromString(safeDto.targetHandle);

    // 2. 비즈니스 검증: 소스/타겟 블럭 마운트가 같은 페이지에 존재하는지 확인
    const sourceBlockMount =
      await blockMountRepository.findById(sourceBlockMountId);
    const targetBlockMount =
      await blockMountRepository.findById(targetBlockMountId);

    if (!sourceBlockMount || !targetBlockMount) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_NOT_FOUND',
          'Source or target block mount not found',
          {
            sourceId: safeDto.sourceBlockMountId,
            targetId: safeDto.targetBlockMountId,
            sourceFound: !!sourceBlockMount,
            targetFound: !!targetBlockMount,
          }
        )
      );
    }

    // 3. 비즈니스 검증: 블럭 마운트가 동일한 페이지에 있는지 확인
    const sourceBM = sourceBlockMount.getBlockMount();
    const targetBM = targetBlockMount.getBlockMount();

    if (!sourceBM.pageId.equals(pageId) || !targetBM.pageId.equals(pageId)) {
      return Result.error(
        new CanvasManagementError(
          'PAGE_MISMATCH',
          'Block mounts must be on the same page as the edge'
        )
      );
    }

    // 4. SafeDTO → Command 변환 (선택 필드: label, style, markerEnd, markerStart)
    const command: CreateEdgeCommand = {
      pageId,
      sourceBlockMountId,
      targetBlockMountId,
      sourceHandle,
      targetHandle,
      userId: safeUserId,
      ...(safeDto.label != null && { label: safeDto.label }),
      ...(safeDto.style != null && { style: safeDto.style }),
      ...(safeDto.shape != null && { shape: safeDto.shape }),
      ...(safeDto.markerEnd != null && { markerEnd: safeDto.markerEnd }),
      ...(safeDto.markerStart != null && { markerStart: safeDto.markerStart }),
    };

    // 5. Aggregate에 Command 전달 (Command → Event)
    const aggregate = EdgeAggregate.createEdge(command);

    // 6. Repository에 저장
    await edgeRepository.create(aggregate);

    // 7. 도메인 이벤트 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 8. Event 커밋
    aggregate.markEventsAsCommitted();

    // 9. Result.success(aggregate) 반환
    return Result.success(aggregate);
  } catch (error) {
    console.error('❌ [createEdge] Edge creation failed:', error);
    return Result.error(
      new CanvasManagementError(
        'EDGE_CREATION_FAILED',
        `Failed to create edge: ${error}`
      )
    );
  }
}
