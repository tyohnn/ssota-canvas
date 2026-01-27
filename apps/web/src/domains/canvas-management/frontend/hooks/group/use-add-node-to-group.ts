import { useMutation } from '@tanstack/react-query';

import { isFailure } from '@/lib';

import { addNodeToGroupAction } from '../../../actions/group-node/add-node-to-group.action';
import type { AddNodeToGroupRequest } from '../../../shared/dtos/requests';
import type { ReactFlowDependencies } from './types';

export interface UseAddNodeToGroupParams {
  reactFlow: ReactFlowDependencies;
}

interface AddNodeToGroupContext {
  previousNodes: {
    childId: string;
    previousParentId: string | undefined;
    previousPosition: { x: number; y: number };
  } | null;
}

/**
 * 노드를 그룹에 추가하는 훅 (Optimistic Update)
 *
 * Container Hook: React Flow 의존성을 주입받아 실행
 * - 의존성 주입 패턴으로 테스트 가능성 향상
 */
export function useAddNodeToGroup(params: UseAddNodeToGroupParams) {
  const { reactFlow } = params;

  return useMutation<
    { success: true },
    Error,
    AddNodeToGroupRequest,
    AddNodeToGroupContext
  >({
    mutationFn: async (dto: AddNodeToGroupRequest) => {
      const result = await addNodeToGroupAction(dto);
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to add node to group');
      }
      return result.data;
    },
    onMutate: async (variables: AddNodeToGroupRequest) => {
      // Optimistic update: React Flow 상태 즉시 변경
      const childNode = reactFlow.getNode(variables.childBlockMountId);
      const parentNode = reactFlow.getNode(variables.parentBlockMountId);

      if (!childNode || !parentNode) {
        return { previousNodes: null };
      }

      // 이전 상태 저장 (롤백용)
      const previousNodes = {
        childId: childNode.id,
        previousParentId: childNode.parentId,
        previousPosition: { ...childNode.position },
      };

      // 절대 → 상대 좌표 변환
      const relativePosition = {
        x: variables.childAbsolutePosition.x - variables.parentPosition.x,
        y: variables.childAbsolutePosition.y - variables.parentPosition.y,
      };

      // React Flow 노드 업데이트
      // updateNode를 사용하여 직접 업데이트 (setNodes보다 더 즉시 반영됨)
      if (reactFlow.updateNode) {
        reactFlow.updateNode(variables.childBlockMountId, {
          parentId: variables.parentBlockMountId,
          position: relativePosition,
          data: {
            ...childNode.data,
            parentBlockMountId: variables.parentBlockMountId,
          },
        });
      } else {
        // Fallback: setNodes 사용 (부모가 자식보다 먼저 오도록 정렬)
        reactFlow.setNodes((nodes) => {
          // 1. 업데이트된 노드 생성
          const updatedNodes = nodes.map((node) => {
            if (node.id === variables.childBlockMountId) {
              return {
                ...node,
                parentId: variables.parentBlockMountId,
                position: relativePosition,
                data: {
                  ...node.data,
                  parentBlockMountId: variables.parentBlockMountId,
                },
              };
            }
            return node;
          });

          // 2. 부모가 자식보다 먼저 오도록 재정렬
          const parentIndex = updatedNodes.findIndex(n => n.id === variables.parentBlockMountId);
          const childIndex = updatedNodes.findIndex(n => n.id === variables.childBlockMountId);

          // 부모가 자식보다 뒤에 있으면 순서 수정
          if (parentIndex > childIndex && parentIndex !== -1 && childIndex !== -1) {
            // 자식을 제거하고 부모 바로 뒤에 삽입
            const [removedChild] = updatedNodes.splice(childIndex, 1);
            if (removedChild) {
              // 자식 제거 후 인덱스가 변경되므로 다시 찾음
              const newParentIndex = updatedNodes.findIndex(n => n.id === variables.parentBlockMountId);
              updatedNodes.splice(newParentIndex + 1, 0, removedChild);
            }
          }

          return updatedNodes;
        });
      }

      return { previousNodes };
    },
    onError: (error: Error, variables: AddNodeToGroupRequest, context: AddNodeToGroupContext | undefined) => {
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

      console.error('Failed to add node to group:', error);
    },
    onSuccess: (data: { success: true }, variables: AddNodeToGroupRequest) => {
      // Server confirmed - optimistic update already applied
    },
  });
}
