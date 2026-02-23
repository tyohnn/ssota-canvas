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
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { EventLogPolicyContext } from '@/domains/event-management';
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { Result } from '@/utils/result';

import { GroupCreatedFromNodesEvent } from '../../../shared/events';

import type { CreateGroupFromNodesRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import type { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';
import { createAndMountBlock } from '../block-mount/create-and-mount-block.service';

export type CreateGroupFromNodesParams = {
  nodeAggregates: BlockMountAggregate[];
  safeDto: CreateGroupFromNodesRequest;
  safeUserId: UserId;
  safeWorkspaceId: WorkspaceId;
  blockRepository: IBlockRepository;
  blockMountRepository: BlockMountRepository;
  eventLogPolicyContext?: EventLogPolicyContext;
};

export async function createGroupFromNodes(
  params: CreateGroupFromNodesParams
): Promise<Result<{ groupBlockMountId: string; groupBlockId: string }, Error>> {
  const {
    nodeAggregates,
    safeDto,
    safeUserId,
    safeWorkspaceId,
    blockRepository,
    blockMountRepository,
    eventLogPolicyContext,
  } = params;

  try {
    // 0. 그룹 블록은 다른 그룹의 자식이 될 수 없음 — GROUP 타입 노드 제외
    const blockIds = nodeAggregates.map(agg =>
      agg.getBlockMount().blockId
    );
    const blocks = await Promise.all(
      blockIds.map(id => blockRepository.findById(id))
    );
    const nonGroupAggregates = nodeAggregates.filter((agg, i) => {
      const block = blocks[i];
      return block && block.blockType.value !== BlockType.GROUP;
    });
    if (nonGroupAggregates.length === 0) {
      return Result.error(
        new CanvasManagementError(
          'NESTED_GROUP_NOT_ALLOWED',
          'Group blocks cannot be nested. Select non-group blocks to create a group.'
        )
      );
    }
    const effectiveNodeAggregates = nonGroupAggregates;

    // 1. 부모 노드들의 위치 정보 조회 (상대→절대 좌표 변환용)
    const nodesWithParent = effectiveNodeAggregates.filter(
      agg => agg.getBlockMount().parentBlockMountId !== null
    );

    const parentIds = [
      ...new Set(
        nodesWithParent
          .map(agg => agg.getBlockMount().parentBlockMountId?.value)
          .filter(Boolean)
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
    const absolutePositions = new Map<string, { x: number; y: number }>();
    effectiveNodeAggregates.forEach(agg => {
      const mount = agg.getBlockMount();
      const parentId = mount.parentBlockMountId?.value;
      const parentPos = parentId ? parentPositions.get(parentId) : null;

      if (parentPos) {
        absolutePositions.set(mount.id.value, {
          x: parentPos.x + mount.position.x,
          y: parentPos.y + mount.position.y,
        });
      } else {
        absolutePositions.set(mount.id.value, {
          x: mount.position.x,
          y: mount.position.y,
        });
      }
    });

    // 3. 기존 그룹에서 해제 (DB 배치 업데이트)
    if (nodesWithParent.length > 0) {
      const ungroupItems = nodesWithParent.map(agg => {
        const mount = agg.getBlockMount();
        const absolutePos = absolutePositions.get(mount.id.value)!;
        return {
          blockMountId: mount.id,
          parentBlockMountId: null,
          position: absolutePos,
        };
      });
      await blockMountRepository.updateParentAndPositionMany(ungroupItems);
    }

    // 4. 모든 노드를 포함하는 바운딩 박스 계산 (절대 좌표 사용!)
    const positions = effectiveNodeAggregates.map(agg => {
      const mount = agg.getBlockMount();
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

    const padding = 20;
    const groupPosition = {
      x: minX - padding,
      y: minY - padding,
    };
    const groupSize = {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };

    // 5. 그룹 블록 생성 (Block 엔티티 + BlockMount)
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

    // 6. 각 노드를 그룹의 자식으로 설정 (절대좌표 → 상대좌표 변환, 배치 업데이트)
    const attachToGroupItems = effectiveNodeAggregates.map(agg => {
      const mount = agg.getBlockMount();
      const absPos = absolutePositions.get(mount.id.value)!;
      return {
        blockMountId: mount.id,
        parentBlockMountId: groupBlockMountId,
        position: {
          x: absPos.x - groupPosition.x,
          y: absPos.y - groupPosition.y,
        },
      };
    });
    await blockMountRepository.updateParentAndPositionMany(attachToGroupItems);

    const groupCreatedEvent = new GroupCreatedFromNodesEvent(
      groupBlockMountId,
      {
        groupBlockMountId,
        childBlockMountIds: safeDto.nodeIds,
      },
      new Date()
    );
    await Promise.allSettled([
      groupCreatedEvent.handle(eventLogPolicyContext),
    ]);

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
