/**
 * 노드를 그룹에 추가: 절대 → 상대 좌표 변환 후 DB 저장
 *
 * ⚠️ child/parent aggregate는 secure action에서 조회 후 params로 전달 (서비스 내부에서 findByPageIdAndSlug 사용 안 함)
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import type { AddNodeToGroupRequest } from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

export type AddNodeToGroupParams = {
  safeDto: AddNodeToGroupRequest;
  safeChildAggregate: BlockMountAggregate;
  safeParentAggregate: BlockMountAggregate;
  blockMountRepository: BlockMountRepository;
};

export async function addNodeToGroup(
  params: AddNodeToGroupParams
): Promise<Result<void, Error>> {
  const {
    safeDto,
    safeChildAggregate: childAgg,
    safeParentAggregate: parentAgg,
    blockMountRepository,
  } = params;

  try {
    const relativePosition = {
      x: safeDto.childAbsolutePosition.x - safeDto.parentPosition.x,
      y: safeDto.childAbsolutePosition.y - safeDto.parentPosition.y,
    };

    await blockMountRepository.updateParentAndPosition(
      childAgg.getBlockMount().id,
      {
        parentBlockMountId: parentAgg.getBlockMount().id.value,
        position: relativePosition,
      }
    );

    return Result.success(undefined);
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'ADD_NODE_TO_GROUP_FAILED',
        `Failed to add node to group: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
