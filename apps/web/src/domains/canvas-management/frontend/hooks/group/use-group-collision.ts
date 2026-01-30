import { useCallback } from 'react';
import type { Node } from '@xyflow/react';

import { getAbsoluteNodePosition } from './utils/get-absolute-node-position';

import type {
  ReactFlowReadonlyDependencies,
  GroupCollisionDependencies,
} from './types';

export interface UseGroupCollisionParams {
  pageId: string;
  reactFlow: ReactFlowReadonlyDependencies;
  groupActions: GroupCollisionDependencies;
}

/**
 * 그룹 충돌 감지 훅
 *
 * 노드가 드래그될 때 그룹 노드와의 충돌을 감지하여
 * 자동으로 group/ungroup을 처리합니다.
 */
export function useGroupCollision(params: UseGroupCollisionParams) {
  const { pageId, reactFlow, groupActions } = params;

  /**
   * 두 노드가 겹치는지 확인
   */
  const checkCollision = useCallback(
    (node1: Node, node2: Node): boolean => {
      const node1Right = node1.position.x + (node1.width || 0);
      const node1Bottom = node1.position.y + (node1.height || 0);
      const node2Right = node2.position.x + (node2.width || 0);
      const node2Bottom = node2.position.y + (node2.height || 0);

      return !(
        node1Right < node2.position.x ||
        node1.position.x > node2Right ||
        node1Bottom < node2.position.y ||
        node1.position.y > node2Bottom
      );
    },
    []
  );

  /**
   * 노드가 그룹 안에 있는지 확인
   */
  const isNodeInsideGroup = useCallback(
    (node: Node, groupNode: Node): boolean => {
      const nodeRight = node.position.x + (node.width || 0);
      const nodeBottom = node.position.y + (node.height || 0);
      const groupRight = groupNode.position.x + (groupNode.width || 0);
      const groupBottom = groupNode.position.y + (groupNode.height || 0);

      // 노드의 중심점이 그룹 안에 있는지 확인
      const nodeCenterX = node.position.x + (node.width || 0) / 2;
      const nodeCenterY = node.position.y + (node.height || 0) / 2;

      return (
        nodeCenterX >= groupNode.position.x &&
        nodeCenterX <= groupRight &&
        nodeCenterY >= groupNode.position.y &&
        nodeCenterY <= groupBottom
      );
    },
    []
  );

  /**
   * 노드의 절대 좌표를 계산 (부모가 있으면 부모 좌표를 더함)
   */
  const getAbsolutePosition = useCallback(
    (node: Node): { x: number; y: number } => {
      const allNodes = reactFlow.getNodes();
      return getAbsoluteNodePosition(node, allNodes);
    },
    [reactFlow]
  );

  /**
   * 여러 노드의 중심점(centroid) 계산
   * - 부모가 있는 노드는 절대 좌표로 변환 후 계산
   */
  const calculateCentroid = useCallback((nodes: Node[]): { x: number; y: number } => {
    if (nodes.length === 0) {
      return { x: 0, y: 0 };
    }

    const sum = nodes.reduce(
      (acc, node) => {
        // 절대 좌표로 변환
        const absolutePos = getAbsolutePosition(node);
        const centerX = absolutePos.x + (node.width || 0) / 2;
        const centerY = absolutePos.y + (node.height || 0) / 2;
        return {
          x: acc.x + centerX,
          y: acc.y + centerY,
        };
      },
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / nodes.length,
      y: sum.y / nodes.length,
    };
  }, [getAbsolutePosition]);

  /**
   * 점이 그룹 안에 있는지 확인
   */
  const isPointInsideGroup = useCallback(
    (point: { x: number; y: number }, groupNode: Node): boolean => {
      const groupRight = groupNode.position.x + (groupNode.width || 0);
      const groupBottom = groupNode.position.y + (groupNode.height || 0);

      return (
        point.x >= groupNode.position.x &&
        point.x <= groupRight &&
        point.y >= groupNode.position.y &&
        point.y <= groupBottom
      );
    },
    []
  );

  /**
   * 드래그 종료 시 충돌 감지 및 group/ungroup 처리
   * @param draggedNodes - 드래그된 모든 노드 (다중 선택 포함)
   * @returns true if collision was handled (skip position save), false otherwise
   */
  const handleNodeDragStop = useCallback(
    async (draggedNodes: Node[]): Promise<boolean> => {
      if (draggedNodes.length === 0) return false;

      const allNodes = reactFlow.getNodes();
      const groupNodes = allNodes.filter(
        n => n.type === 'group' && !draggedNodes.some(d => d.id === n.id)
      );

      // 다중 선택된 노드들의 중심점 계산
      const centroid = calculateCentroid(draggedNodes);

      // 중심점이 충돌하는 그룹 찾기 (첫 번째로 겹치는 그룹 사용)
      // 그룹이 다른 그룹의 자식일 수 있으므로 절대 좌표로 경계 비교
      // 참고: 자식이 있어도 centroid가 안이면 추가 허용 — 그룹에서 빼었다가 다시 넣기(re-add)가 동작하도록
      let collidingGroup: Node | null = null;
      for (const groupNode of groupNodes) {
        const groupAbs = getAbsolutePosition(groupNode);
        const groupRight = groupAbs.x + (groupNode.width || 0);
        const groupBottom = groupAbs.y + (groupNode.height || 0);
        const inside =
          centroid.x >= groupAbs.x &&
          centroid.x <= groupRight &&
          centroid.y >= groupAbs.y &&
          centroid.y <= groupBottom;
        if (!inside) continue;
        collidingGroup = groupNode;
        break;
      }

      // 모든 드래그된 노드가 같은 부모를 가지고 있는지 확인
      const firstParentId = draggedNodes[0]?.parentId;
      const allSameParent = draggedNodes.every(n => n.parentId === firstParentId);

      // Case 1: 그룹에 속하지 않았는데 그룹 안으로 들어간 경우 → 모든 노드를 Group
      if (!firstParentId && collidingGroup) {
        await Promise.all(
          draggedNodes.map(node =>
            groupActions.addNodeToGroup({
              childBlockMountId: node.id,
              parentBlockMountId: collidingGroup.id,
              childAbsolutePosition: node.position,
              parentPosition: collidingGroup.position,
            })
          )
        );

        return true; // 충돌 처리됨
      }
      // Case 2: 같은 그룹에 속했는데 그룹 밖으로 나간 경우 → 모든 노드를 Ungroup
      else if (firstParentId && allSameParent && !collidingGroup) {
        const parentNode = allNodes.find(n => n.id === firstParentId);
        if (parentNode) {
          await Promise.all(
            draggedNodes.map(node =>
              groupActions.removeNodeFromGroup({
                childBlockMountId: node.id,
                parentPosition: parentNode.position,
                childRelativePosition: node.position, // React Flow는 이미 상대 좌표로 관리
              })
            )
          );
          return true; // 충돌 처리됨
        }
      }
      // Case 3: 같은 그룹에 속했는데 다른 그룹으로 이동한 경우 → Ungroup → Group
      else if (
        firstParentId &&
        allSameParent &&
        collidingGroup &&
        firstParentId !== collidingGroup.id
      ) {
        const oldParentNode = allNodes.find(n => n.id === firstParentId);
        if (oldParentNode) {
          // 중요: 미리 절대 좌표를 계산해둠 (removeNodeFromGroup 호출 전에)
          const absolutePositions = new Map<string, { x: number; y: number }>();
          draggedNodes.forEach(node => {
            const absPos = getAbsolutePosition(node);
            absolutePositions.set(node.id, absPos);
          });

          // 중요: collidingGroup의 위치도 절대 좌표로 변환 필요 (그룹이 다른 그룹의 자식일 수 있음)
          const collidingGroupAbsPos = getAbsolutePosition(collidingGroup);

          // 최종 상대 좌표 미리 계산
          const finalRelativePositions = new Map<string, { x: number; y: number }>();
          draggedNodes.forEach(node => {
            const absolutePos = absolutePositions.get(node.id)!;
            finalRelativePositions.set(node.id, {
              x: absolutePos.x - collidingGroupAbsPos.x,
              y: absolutePos.y - collidingGroupAbsPos.y,
            });
          });

          // ====================================================================
          // 그룹 노드는 이미 배열 앞에 있으므로 재정렬 불필요
          // 자식 노드의 parentId와 position만 업데이트하면 됨
          // ====================================================================
          const draggedNodeIds = new Set(draggedNodes.map(n => n.id));

          // 현재 노드 배열을 가져와서 직접 수정
          const currentNodes = reactFlow.getNodes();

          // 자식 노드의 parentId와 position만 업데이트
          const updatedNodes = currentNodes.map(node => {
            if (draggedNodeIds.has(node.id)) {
              const finalRelPos = finalRelativePositions.get(node.id)!;
              return {
                ...node,
                parentId: collidingGroup.id,
                position: finalRelPos,
                data: {
                  ...node.data,
                  parentBlockMountId: collidingGroup.id,
                },
              };
            }
            return node;
          });

          // 직접 배열 전달 (콜백 아님) - 동기적 업데이트
          reactFlow.setNodes(updatedNodes);

          // 서버에 변경사항 저장 (UI는 이미 업데이트됨, 서버 동기화만 수행)
          // 먼저 기존 그룹에서 모든 노드 제거 (병렬 처리)
          await Promise.all(
            draggedNodes.map(node =>
              groupActions.removeNodeFromGroup({
                childBlockMountId: node.id,
                parentPosition: oldParentNode.position,
                childRelativePosition: node.position,
              })
            )
          );

          // 새 그룹에 모든 노드 추가 (미리 계산한 절대 좌표 사용)
          await Promise.all(
            draggedNodes.map(node => {
              const absolutePos = absolutePositions.get(node.id)!;
              return groupActions.addNodeToGroup({
                childBlockMountId: node.id,
                parentBlockMountId: collidingGroup.id,
                childAbsolutePosition: absolutePos,
                parentPosition: collidingGroupAbsPos,
              });
            })
          );

          return true; // 충돌 처리됨
        }
      }

      return false; // 충돌 없음
    },
    [reactFlow, calculateCentroid, isPointInsideGroup, groupActions, getAbsolutePosition]
  );

  return {
    handleNodeDragStop,
    checkCollision,
    isNodeInsideGroup,
    calculateCentroid,
    isPointInsideGroup,
    getAbsolutePosition,
  };
}
