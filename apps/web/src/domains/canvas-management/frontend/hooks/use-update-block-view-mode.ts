/**
 * Block View Mode Update Hook
 *
 * 블록의 View Mode를 업데이트하는 훅
 * - Optimistic update: sizes에서 새로운 viewMode의 크기를 가져와서 즉시 업데이트
 * - onSuccess: 서버에서 반환한 정확한 크기로 업데이트 및 sizes 저장
 */

'use client';

import { flushSync } from 'react-dom';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Node } from '@xyflow/react';
import { useUpdateNodeInternals } from '@xyflow/react';

import { BaseNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { isFailure } from '@/lib';

import { updateBlockMountViewModeAction } from '../../actions/block-mount/update-block-view-mode.action';
import type { BlockViewModeUpdatedDTO } from '../../shared/dtos/responses/block.responses';
import type { BlockViewModeValue } from '../../shared/value-objects/block-view-mode.vo';

export type ReactFlowDependencies = {
  getNode: (nodeId: string) => Node | undefined;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
};

export type UseUpdateBlockViewModeParams = {
  blockMountId: string;
  pageId: string;
  reactFlow: ReactFlowDependencies;
};

export type UseUpdateBlockViewModeResult = {
  updateViewMode: (viewMode: BlockViewModeValue) => Promise<void>;
  isUpdating: boolean;
};

type UpdateViewModeContext = {
  previousViewMode: BlockViewModeValue | undefined;
  previousNode: Node | null;
};

export function useUpdateBlockViewMode({
  blockMountId,
  pageId,
  reactFlow,
}: UseUpdateBlockViewModeParams): UseUpdateBlockViewModeResult {
  const { getNode, setNodes } = reactFlow;
  const queryClient = useQueryClient();
  const updateNodeInternals = useUpdateNodeInternals();

  const mutation = useMutation<
    BlockViewModeUpdatedDTO,
    Error,
    BlockViewModeValue,
    UpdateViewModeContext
  >({
    mutationFn: async (viewMode: BlockViewModeValue) => {
      const result = await updateBlockMountViewModeAction({
        blockMountId,
        viewMode,
      });

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (viewMode: BlockViewModeValue) => {
      // Optimistic update: 새로운 viewMode로 변경하고 해당 크기 적용
      const node = getNode(blockMountId);

      if (!node) {
        return { previousViewMode: undefined, previousNode: null };
      }

      const nodeData = node.data as BaseNodeData;
      const previousViewMode = nodeData.viewMode;
      const sizes = nodeData.sizes || {};

      // sizes에서 새로운 viewMode의 크기 가져오기
      let newSize = {
        width: node.width || 0,
        height: node.height || 0,
      };

      if (sizes[viewMode]) {
        const viewModeSize = sizes[viewMode];
        if (
          viewModeSize &&
          typeof viewModeSize.width === 'number' &&
          typeof viewModeSize.height === 'number'
        ) {
          newSize = {
            width: viewModeSize.width,
            height: viewModeSize.height,
          };
        }
      }

      // Optimistic update: viewMode와 크기를 동기적으로 즉시 업데이트
      // flushSync를 사용하여 React의 배치 업데이트를 우회하고 즉시 DOM에 반영
      flushSync(() => {
        setNodes(nodes =>
          nodes.map(n =>
            n.id === blockMountId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    viewMode,
                  },
                  width: newSize.width,
                  height: newSize.height,
                }
              : n
          )
        );
      });

      // React Flow에게 노드 내부가 변경되었음을 알림
      // 이렇게 하면 엣지가 새로운 핸들 위치에 올바르게 연결됨
      updateNodeInternals(blockMountId);

      return {
        previousViewMode,
        previousNode: node,
      };
    },
    onError: (error, viewMode, context) => {
      // Rollback: 이전 상태로 복원
      if (context?.previousNode) {
        setNodes(nodes =>
          nodes.map(n =>
            n.id === blockMountId
              ? {
                  ...context.previousNode!,
                  data: {
                    ...context.previousNode!.data,
                    viewMode: context.previousViewMode,
                  },
                }
              : n
          )
        );
      }
    },
    onSuccess: (data, viewMode, context) => {
      // 서버에서 반환한 정확한 크기로 업데이트
      // onMutate에서 이미 viewMode를 변경했으므로, 서버 응답의 size를 sizes[viewMode]에 저장
      if (data?.size) {
        setNodes(nodes =>
          nodes.map(n => {
            if (n.id !== blockMountId) return n;

            const nodeData = n.data as BaseNodeData;
            const currentViewMode = nodeData.viewMode || viewMode; // onMutate에서 업데이트된 viewMode

            // sizes 업데이트: 현재 viewMode의 크기를 서버 응답으로 업데이트
            const updatedSizes = {
              ...(nodeData.sizes || {}),
              [currentViewMode]: {
                width: data.size.width,
                height: data.size.height,
              },
            };

            return {
              ...n,
              data: {
                ...nodeData,
                sizes: updatedSizes,
              },
              width: data.size.width,
              height: data.size.height,
            };
          })
        );
      }

      // 서버에서 반환한 크기로 업데이트 후에도 노드 내부 업데이트
      // 크기가 변경되었을 수 있으므로 엣지 연결을 다시 계산
      updateNodeInternals(blockMountId);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['canvas', pageId] });
    },
  });

  return {
    updateViewMode: async (viewMode: BlockViewModeValue): Promise<void> => {
      await mutation.mutateAsync(viewMode);
    },
    isUpdating: mutation.isPending,
  };
}
