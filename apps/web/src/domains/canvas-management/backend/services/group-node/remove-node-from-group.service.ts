/**
 * 노드를 그룹에서 분리: 상대 → 절대 좌표 변환 후 DB 저장
 *
 * ⚠️ child aggregate는 secure action에서 조회 후 params로 전달 (서비스 내부에서 findByPageIdAndSlug 사용 안 함)
 */
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import type { RemoveNodeFromGroupRequest } from '@/domains/canvas-management/shared/dtos/requests';
import type { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import { Result } from '@/utils/result';

import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';

export type RemoveNodeFromGroupParams = {
  safeDto: RemoveNodeFromGroupRequest;
  safeChildAggregate: BlockMountAggregate;
  blockMountRepository: BlockMountRepository;
};

export async function removeNodeFromGroup(
  params: RemoveNodeFromGroupParams
): Promise<Result<void, Error>> {
  const { safeDto, safeChildAggregate: childAgg, blockMountRepository } = params;

  try {
    const absolutePosition = {
      x: safeDto.parentPosition.x + safeDto.childRelativePosition.x,
      y: safeDto.parentPosition.y + safeDto.childRelativePosition.y,
    };

    await blockMountRepository.updateParentAndPosition(
      childAgg.getBlockMount().id,
      {
        parentBlockMountId: null,
        position: absolutePosition,
      }
    );

    return Result.success(undefined);
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'REMOVE_NODE_FROM_GROUP_FAILED',
        `Failed to remove node from group: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
