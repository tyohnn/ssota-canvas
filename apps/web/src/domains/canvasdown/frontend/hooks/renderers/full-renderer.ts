/**
 * Full Renderer
 * 
 * 전체 DSL 렌더링 로직
 * 노드 생성 → 그룹 추가 → 엣지 생성 순서를 관리합니다.
 */

import type { Node, Edge } from '@xyflow/react';
import type { UseCanvasBlockLifecycleResult } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';
import { calculateOffset, adjustPosition, type Position } from '../utils/position-adjuster';
import { createNodeFromCanvasdown } from '../services/node-creation.service';
import {
  addChildToGroup,
  findParentNode,
  findParentBlockMountId,
} from '../services/group-management.service';
import { createEdgesFromCanvasdown } from '../services/edge-creation.service';

export interface FullRendererParams {
  nodes: Node[];
  edges: Edge[];
  startPosition: Position;
  blockLifecycle: UseCanvasBlockLifecycleResult;
  edgeLifecycle: ReturnType<typeof useCanvasEdgeLifecycle>;
  nodeIdMap: Map<string, string>;
}

export interface FullRendererResult {
  success: boolean;
  createdNodes: string[];
  createdEdges: number;
  errors: Error[];
}

/**
 * 전체 DSL을 렌더링합니다.
 * 
 * @param params - 렌더링 파라미터
 * @returns 렌더링 결과
 */
export async function renderFullCanvasdown(
  params: FullRendererParams
): Promise<FullRendererResult> {
  const {
    nodes,
    edges,
    startPosition,
    blockLifecycle,
    edgeLifecycle,
    nodeIdMap,
  } = params;

  const errors: Error[] = [];
  const createdNodes: string[] = [];

  try {
    // 1. 오프셋 계산
    const offset = calculateOffset({ startPosition, nodes });

    // 2. 노드들을 부모(zone)와 자식으로 분리
    // React Flow 요구사항: 부모 노드가 자식보다 먼저 생성되어야 함
    const parentNodes = nodes.filter(n => !n.parentId);
    const childNodes = nodes.filter(n => n.parentId);

    // 부모 노드들을 먼저 정렬 (zone 블록이 먼저 오도록)
    const sortedParentNodes = [...parentNodes].sort((a, b) => {
      const aIsGroup = a.type === 'group';
      const bIsGroup = b.type === 'group';
      if (aIsGroup && !bIsGroup) return -1;
      if (!aIsGroup && bIsGroup) return 1;
      return 0;
    });

    // 3. 부모 노드들을 먼저 생성
    const parentNodeCreationPromises = sortedParentNodes.map(
      async (canvasdownNode) => {
        const adjustedPosition = adjustPosition(
          canvasdownNode.position,
          offset
        );

        const result = await createNodeFromCanvasdown({
          canvasdownNode,
          adjustedPosition,
          blockLifecycle,
          nodeIdMap,
        });

        if (result.success && result.blockMountId) {
          createdNodes.push(result.blockMountId);
        }

        return result;
      }
    );

    // 부모 노드 생성 완료 대기
    const parentNodeResults = await Promise.all(parentNodeCreationPromises);

    // 4. 자식 노드들을 생성 (부모 노드 생성 완료 후)
    const childNodeCreationPromises = childNodes.map(
      async (canvasdownNode) => {
        // 부모 노드의 blockMountId 확인
        const parentCanvasdownId = canvasdownNode.parentId;
        if (!parentCanvasdownId) {
          console.warn(
            `[FullRenderer] Child node ${canvasdownNode.id} has no parentId`
          );
          return { blockMountId: null, success: false };
        }

        const parentBlockMountId = findParentBlockMountId(
          parentCanvasdownId,
          nodeIdMap
        );
        if (!parentBlockMountId) {
          console.warn(
            `[FullRenderer] Parent block not found for child node ${canvasdownNode.id}, parentId: ${parentCanvasdownId}`
          );
          return { blockMountId: null, success: false };
        }

        // 부모 노드의 위치 찾기
        const parentNode = findParentNode(canvasdownNode, parentNodes);
        if (!parentNode) {
          console.warn(
            `[FullRenderer] Parent node not found in nodes for ${parentCanvasdownId}`
          );
          return { blockMountId: null, success: false };
        }

        // 자식 노드의 위치 조정
        const childAdjustedPosition = adjustPosition(
          canvasdownNode.position,
          offset
        );
        const parentAdjustedPosition = adjustPosition(
          parentNode.position,
          offset
        );

        // 자식 노드 생성
        const createResult = await createNodeFromCanvasdown({
          canvasdownNode,
          adjustedPosition: childAdjustedPosition,
          blockLifecycle,
          nodeIdMap,
        });

        if (!createResult.success || !createResult.blockMountId) {
          return createResult;
        }

        createdNodes.push(createResult.blockMountId);

        // 부모가 있으면 그룹에 추가 (setNodes가 id로 찾으므로 getNode 불필요)
        const groupResult = await addChildToGroup({
          childNode: canvasdownNode,
          parentNode,
          childBlockMountId: createResult.blockMountId,
          parentBlockMountId,
          childAdjustedPosition,
          parentAdjustedPosition,
          blockLifecycle,
        });

        if (!groupResult.success && groupResult.error) {
          errors.push(groupResult.error);
        }

        return createResult;
      }
    );

    // 자식 노드 생성 완료 대기
    const childNodeResults = await Promise.all(childNodeCreationPromises);

    // 5. 엣지 추가 (노드가 모두 생성된 후)
    let createdEdgesCount = 0;
    if (edges.length > 0) {
      const edgeParams = edges.map((canvasdownEdge) => ({
        canvasdownEdge,
        nodeIdMap,
        edgeLifecycle,
      }));

      const edgeResults = await createEdgesFromCanvasdown(edgeParams);

      createdEdgesCount = edgeResults.filter((r) => r.success).length;

      // 에러 수집
      edgeResults.forEach((result) => {
        if (!result.success && result.error) {
          errors.push(result.error);
        }
      });
    }

    return {
      success: errors.length === 0,
      createdNodes,
      createdEdges: createdEdgesCount,
      errors,
    };
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    errors.push(errorObj);
    return {
      success: false,
      createdNodes,
      createdEdges: 0,
      errors,
    };
  }
}
