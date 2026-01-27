import { useMutation } from '@tanstack/react-query';

import { isFailure } from '@/lib';

import { removeNodeFromGroupAction } from '../../../actions/group-node/remove-node-from-group.action';
import type { RemoveNodeFromGroupRequest } from '../../../shared/dtos/requests';
import type { ReactFlowDependencies } from './types';

export interface UseRemoveNodeFromGroupParams {
  reactFlow: ReactFlowDependencies;
}

interface RemoveNodeFromGroupContext {
  previousNodes: {
    childId: string;
    previousParentId: string | undefined;
    previousPosition: { x: number; y: number };
  } | null;
}

/**
 * 노드를 그룹에서 제거하는 훅 (Optimistic Update)
 *
 * Container Hook: React Flow 의존성을 주입받아 실행
 * - 의존성 주입 패턴으로 테스트 가능성 향상
 */
export function useRemoveNodeFromGroup(params: UseRemoveNodeFromGroupParams) {
  const { reactFlow } = params;

  return useMutation<
    { success: true },
    Error,
    RemoveNodeFromGroupRequest,
    RemoveNodeFromGroupContext
  >({
    mutationFn: async (dto: RemoveNodeFromGroupRequest) => {
      const result = await removeNodeFromGroupAction(dto);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to remove node from group');
      }
      return result.data;
    },
    onMutate: async (variables: RemoveNodeFromGroupRequest) => {
      // Optimistic update: React Flow 상태 즉시 변경
      const childNode = reactFlow.getNode(variables.childBlockMountId);
      const parentNode = childNode?.parentId ? reactFlow.getNode(childNode.parentId) : null;

      if (!childNode) {
        return { previousNodes: null };
      }

      // 이전 상태 저장 (롤백용)
      const previousNodes = {
        childId: childNode.id,
        previousParentId: childNode.parentId,
        previousPosition: { ...childNode.position },
      };

      // 상대 → 절대 좌표 변환
      const absolutePosition = {
        x: variables.parentPosition.x + variables.childRelativePosition.x,
        y: variables.parentPosition.y + variables.childRelativePosition.y,
      };

      // React Flow 노드 업데이트
      // updateNode를 사용하여 직접 업데이트 (setNodes보다 더 즉시 반영됨)
      if (reactFlow.updateNode) {
        reactFlow.updateNode(variables.childBlockMountId, {
          parentId: undefined,
          position: absolutePosition,
          data: {
            ...childNode.data,
            parentBlockMountId: undefined,
          },
        });
      } else {
        // Fallback: setNodes 사용
        reactFlow.setNodes((nodes) => {
          const updated = nodes.map((node) => {
            if (node.id === variables.childBlockMountId) {
              return {
                ...node,
                parentId: undefined,
                position: absolutePosition,
                data: {
                  ...node.data,
                  parentBlockMountId: undefined,
                },
              };
            }
            return node;
          });

          return updated;
        });
      }

      return { previousNodes };
    },
    onError: (error: Error, variables: RemoveNodeFromGroupRequest, context: RemoveNodeFromGroupContext | undefined) => {
      // 롤백: 이전 상태로 복원
      if (context?.previousNodes) {
        const { childId, previousParentId, previousPosition } =
          context.previousNodes;

        reactFlow.setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id === childId) {
              return {
                ...node,
                parentId: previousParentId,
                position: previousPosition,
                data: {
                  ...node.data,
                  parentBlockMountId: previousParentId,
                },
              };
            }
            return node;
          })
        );
      }

      console.error('Failed to remove node from group:', error);
    },
    onSuccess: (data: { success: true }, variables: RemoveNodeFromGroupRequest) => {
      // Server confirmed - optimistic update already applied
    },
  });
}
