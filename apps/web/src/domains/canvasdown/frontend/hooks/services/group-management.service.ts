/**
 * Group Management Service
 * 
 * 자식 노드를 그룹에 추가하는 서비스
 * 부모-자식 관계를 처리합니다.
 */

import type { Node } from '@xyflow/react';
import type { UseCanvasBlockLifecycleResult } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { Position } from '../utils/position-adjuster';

export interface AddChildToGroupParams {
  childNode: Node;
  parentNode: Node;
  childBlockMountId: string;
  parentBlockMountId: string;
  childAdjustedPosition: Position;
  parentAdjustedPosition: Position;
  blockLifecycle: UseCanvasBlockLifecycleResult;
}

export interface AddChildToGroupResult {
  success: boolean;
  error?: Error;
}

/**
 * 자식 노드를 그룹에 추가합니다.
 * 
 * @param params - 그룹 추가 파라미터
 * @returns 추가 결과
 */
export async function addChildToGroup(
  params: AddChildToGroupParams
): Promise<AddChildToGroupResult> {
  const {
    childBlockMountId,
    parentBlockMountId,
    childAdjustedPosition,
    parentAdjustedPosition,
    blockLifecycle,
  } = params;

  try {
    await blockLifecycle.addNodeToGroup({
      childBlockMountId,
      parentBlockMountId,
      childAbsolutePosition: childAdjustedPosition,
      parentPosition: parentAdjustedPosition,
    });

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      `[GroupManagementService] Error adding child to group:`,
      error
    );

    return {
      success: false,
      error: error instanceof Error ? error : new Error(errorMessage),
    };
  }
}

/**
 * 자식 노드의 부모 노드를 찾습니다.
 * 
 * @param childNode - 자식 노드
 * @param parentNodes - 부모 노드 배열
 * @returns 부모 노드 또는 null
 */
export function findParentNode(
  childNode: Node,
  parentNodes: Node[]
): Node | null {
  const parentId = childNode.parentId;
  if (!parentId) {
    return null;
  }

  return parentNodes.find(p => p.id === parentId) || null;
}

/**
 * 부모 노드의 blockMountId를 찾습니다.
 * 
 * @param parentCanvasdownId - 부모 노드의 Canvasdown ID
 * @param nodeIdMap - ID 매핑 맵
 * @returns 부모 노드의 blockMountId 또는 null
 */
export function findParentBlockMountId(
  parentCanvasdownId: string,
  nodeIdMap: Map<string, string>
): string | null {
  return nodeIdMap.get(parentCanvasdownId) || null;
}
