/**
 * Group Node 서비스
 *
 * 노드를 그룹에 추가/분리 시 좌표 변환 및 DB 저장
 * - addNodeToGroup: 절대 → 상대 좌표 변환
 * - removeNodeFromGroup: 상대 → 절대 좌표 변환
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import type {
  AddNodeToGroupRequest,
  RemoveNodeFromGroupRequest,
  CreateGroupFromNodesRequest,
} from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import type { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import { createAndMountBlock } from '../block-mount/create-and-mount-block.service';

export async function addNodeToGroup(
  safeDto: AddNodeToGroupRequest,
  blockMountRepository: BlockMountRepository
): Promise<Result<void, Error>> {
  try {
    const childAgg = await blockMountRepository.findById(
      new BlockMountId(safeDto.childBlockMountId)
    );
    const parentAgg = await blockMountRepository.findById(
      new BlockMountId(safeDto.parentBlockMountId)
    );

    if (!childAgg || !parentAgg) {
      return Result.error(
        new CanvasManagementError(
          'GROUP_NODE_NOT_FOUND',
          'Child or parent block mount not found'
        )
      );
    }

    if (childAgg.getBlockMount().pageId.value !== safeDto.pageId) {
      return Result.error(
        new CanvasManagementError(
          'GROUP_NODE_PAGE_MISMATCH',
          'Child block mount is not on the given page'
        )
      );
    }

    if (parentAgg.getBlockMount().pageId.value !== safeDto.pageId) {
      return Result.error(
        new CanvasManagementError(
          'GROUP_NODE_PAGE_MISMATCH',
          'Parent block mount is not on the given page'
        )
      );
    }

    // 절대 → 상대 좌표 변환
    const relativePosition = {
      x: safeDto.childAbsolutePosition.x - safeDto.parentPosition.x,
      y: safeDto.childAbsolutePosition.y - safeDto.parentPosition.y,
    };

    await blockMountRepository.updateParentAndPosition(
      new BlockMountId(safeDto.childBlockMountId),
      {
        parentBlockMountId: safeDto.parentBlockMountId,
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

export async function removeNodeFromGroup(
  safeDto: RemoveNodeFromGroupRequest,
  blockMountRepository: BlockMountRepository
): Promise<Result<void, Error>> {
  try {
    const childAgg = await blockMountRepository.findById(
      new BlockMountId(safeDto.childBlockMountId)
    );

    if (!childAgg) {
      return Result.error(
        new CanvasManagementError(
          'GROUP_NODE_NOT_FOUND',
          'Child block mount not found'
        )
      );
    }

    if (childAgg.getBlockMount().pageId.value !== safeDto.pageId) {
      return Result.error(
        new CanvasManagementError(
          'GROUP_NODE_PAGE_MISMATCH',
          'Child block mount is not on the given page'
        )
      );
    }

    // 상대 → 절대 좌표 변환
    const absolutePosition = {
      x: safeDto.parentPosition.x + safeDto.childRelativePosition.x,
      y: safeDto.parentPosition.y + safeDto.childRelativePosition.y,
    };

    await blockMountRepository.updateParentAndPosition(
      new BlockMountId(safeDto.childBlockMountId),
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

/**
 * 선택된 노드들로 그룹 생성
 * 
 * ⚠️ 전제조건 (Action 레이어에서 검증됨):
 * - 모든 노드가 존재함
 * - 모든 노드가 같은 페이지에 있음
 * - 사용자가 해당 페이지에 접근 권한이 있음
 * 
 * 서비스 책임:
 * 1. 서로 다른 그룹에 속한 노드가 있으면 먼저 그룹 해제
 * 2. 모든 노드를 포함하는 그룹 블록 생성 (Block 엔티티 + BlockMount)
 * 3. 각 노드를 그룹의 자식으로 설정 (상대 좌표 변환)
 */
export async function createGroupFromNodes(
  nodeAggregates: BlockMountAggregate[],
  safeDto: CreateGroupFromNodesRequest,
  safeUserId: UserId,
  safeWorkspaceId: WorkspaceId,
  blockRepository: IBlockRepository,
  blockMountRepository: BlockMountRepository
): Promise<Result<{ groupBlockMountId: string; groupBlockId: string }, Error>> {
  try {

    // 1. 부모 노드들의 위치 정보 조회 (상대→절대 좌표 변환용)
    const nodesWithParent = nodeAggregates.filter(
      agg => agg!.getBlockMount().parentBlockMountId !== null
    );
    
    const parentIds = [
      ...new Set(
        nodesWithParent.map(agg => agg!.getBlockMount().parentBlockMountId?.value).filter(Boolean)
      ),
    ];
    const parentAggregates = await Promise.all(
      parentIds.map(id => blockMountRepository.findById(new BlockMountId(id!)))
    );
    const parentPositions = new Map(
      parentAggregates
        .filter(Boolean)
        .map(agg => [
          agg!.getBlockMount().id.value,
          agg!.getBlockMount().position,
        ])
    );

    // 2. 모든 노드의 절대 좌표 계산 (바운딩 박스 계산 전에!)
    // Note: 부모가 있으면 상대→절대 변환, 부모가 없거나 orphaned면 그대로 사용
    const absolutePositions = new Map<string, { x: number; y: number }>();
    nodeAggregates.forEach(agg => {
      const mount = agg!.getBlockMount();
      const parentId = mount.parentBlockMountId?.value;
      const parentPos = parentId ? parentPositions.get(parentId) : null;
      
      if (parentPos) {
        // 부모가 존재 → 상대 좌표를 절대 좌표로 변환
        absolutePositions.set(mount.id.value, {
          x: parentPos.x + mount.position.x,
          y: parentPos.y + mount.position.y,
        });
      } else {
        // 부모가 없거나 orphaned → 위치를 그대로 절대 좌표로 사용
        absolutePositions.set(mount.id.value, {
          x: mount.position.x,
          y: mount.position.y,
        });
      }
    });

    // 3. 기존 그룹에서 해제 (DB 업데이트)
    if (nodesWithParent.length > 0) {
      await Promise.all(
        nodesWithParent.map(async agg => {
          const mount = agg!.getBlockMount();
          const absolutePos = absolutePositions.get(mount.id.value)!;
          
          await blockMountRepository.updateParentAndPosition(mount.id, {
            parentBlockMountId: null,
            position: absolutePos,
          });
        })
      );
    }

    // 4. 모든 노드를 포함하는 바운딩 박스 계산 (절대 좌표 사용!)
    const positions = nodeAggregates.map(agg => {
      const mount = agg!.getBlockMount();
      const absPos = absolutePositions.get(mount.id.value)!;
      return {
        x: absPos.x,
        y: absPos.y,
        width: mount.size.width,
        height: mount.size.height,
      };
    });

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const padding = 20; // 그룹 경계 패딩
    const groupPosition = {
      x: minX - padding,
      y: minY - padding,
    };
    const groupSize = {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };

    // 3. 그룹 블록 생성 (Block 엔티티 + BlockMount)
    const groupResult = await createAndMountBlock(
      {
        pageId: safeDto.pageId,
        blockType: BlockType.GROUP,
        position: groupPosition,
        size: groupSize,
        title: safeDto.groupTitle || 'New Group',
        initialProperties: {
          title: safeDto.groupTitle || 'New Group',
          color: safeDto.groupColor || '#3b82f6',
        },
      },
      safeUserId,
      safeWorkspaceId,
      blockRepository,
      blockMountRepository
    );

    if (groupResult.isError()) {
      return Result.error(groupResult.error);
    }

    const groupBlockMount = groupResult.value.blockMountAggregate.getBlockMount();
    const groupBlockMountId = groupBlockMount.id.value;
    const groupBlockId = groupBlockMount.blockId.value;

    // 5. 각 노드를 그룹의 자식으로 설정 (절대좌표 → 상대좌표 변환)
    await Promise.all(
      nodeAggregates.map(async agg => {
        const mount = agg!.getBlockMount();
        const absPos = absolutePositions.get(mount.id.value)!;
        const relativePosition = {
          x: absPos.x - groupPosition.x,
          y: absPos.y - groupPosition.y,
        };

        await blockMountRepository.updateParentAndPosition(mount.id, {
          parentBlockMountId: groupBlockMountId,
          position: relativePosition,
        });
      })
    );

    return Result.success({ groupBlockMountId, groupBlockId });
  } catch (error) {
    return Result.error(
      new CanvasManagementError(
        'CREATE_GROUP_FROM_NODES_FAILED',
        `Failed to create group from nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
