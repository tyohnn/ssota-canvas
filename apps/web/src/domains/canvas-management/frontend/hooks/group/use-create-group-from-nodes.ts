import type { Node } from '@xyflow/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { isFailure } from '@/lib';

import { createGroupFromNodesAction } from '../../../actions/group-node/create-group-from-nodes.action';
import type { CreateGroupFromNodesRequest } from '../../../shared/dtos/requests';
import { getAbsoluteNodePosition } from './utils/get-absolute-node-position';
import type { ReactFlowDependencies } from './types';

export interface UseCreateGroupFromNodesParams {
  pageId: string;
  reactFlow: Pick<ReactFlowDependencies, 'getNode' | 'setNodes'> & {
    getNodes: () => Node[];
  };
}

interface CreateGroupContext {
  tempGroupId: string;
  previousChildren: Array<{
    id: string;
    parentId: string | undefined;
    position: { x: number; y: number };
    parentBlockMountId: string | undefined;
  }>;
}

/**
 * 선택된 노드들로 그룹을 생성하는 훅 (Optimistic Update)
 */
export function useCreateGroupFromNodes(params: UseCreateGroupFromNodesParams) {
  const { pageId, reactFlow } = params;
  const { getNodes, getNode, setNodes } = reactFlow;
  const queryClient = useQueryClient();

  return useMutation<
    { groupBlockMountId: string },
    Error,
    Omit<CreateGroupFromNodesRequest, 'pageId'>,
    CreateGroupContext | undefined
  >({
    mutationFn: async (request) => {
      const result = await createGroupFromNodesAction({ ...request, pageId });
      if (isFailure(result)) {
        throw new Error(result.error || 'Failed to create group from nodes');
      }
      return result.data;
    },
    onMutate: async (variables) => {
      const nodes = getNodes();
      let toGroup = variables.nodeIds
        .map(id => nodes.find(n => n.id === id))
        .filter((n): n is Node => !!n);
      if (toGroup.length === 0) return undefined;

      const tempGroupId = `group-optimistic-${Date.now()}`;
      const title = variables.groupTitle ?? 'New Group';
      const color = variables.groupColor ?? 'blue';

      // Stale parentId 정리: 부모가 존재하지 않는 노드의 parentId를 제거
      // 이 경우 position은 이미 절대 좌표라고 가정 (또는 마지막으로 알려진 위치)
      toGroup = toGroup.map(n => {
        if (!n.parentId) return n;
        const parentExists = nodes.some(p => p.id === n.parentId);
        if (parentExists) return n;
        // Stale parentId detected - clear it and treat position as absolute
        return { ...n, parentId: undefined };
      });

      // absolute positions and bbox
      const allNodes = getNodes();
      const absPositions = toGroup.map(n => getAbsoluteNodePosition(n, allNodes));
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      toGroup.forEach((n, i) => {
        const a = absPositions[i]!;
        const w = (n.width as number) ?? 200;
        const h = (n.height as number) ?? 150;
        minX = Math.min(minX, a.x);
        minY = Math.min(minY, a.y);
        maxX = Math.max(maxX, a.x + w);
        maxY = Math.max(maxY, a.y + h);
      });
      const pad = 20; // Must match backend padding in group-node.service.ts
      minX -= pad;
      minY -= pad;
      const gW = Math.max(maxX - minX + pad, 120);
      const gH = Math.max(maxY - minY + pad, 80);

      const previousChildren: CreateGroupContext['previousChildren'] = toGroup.map(n => ({
        id: n.id,
        parentId: n.parentId ?? undefined,
        position: { ...n.position },
        parentBlockMountId: (n.data as any)?.parentBlockMountId,
      }));

      const groupNode: Node = {
        id: tempGroupId,
        type: 'group',
        position: { x: minX, y: minY },
        width: gW,
        height: gH,
        data: {
          blockMountId: tempGroupId,
          blockId: tempGroupId,
          blockType: BlockType.GROUP,
          title,
          viewMode: 'original',
          properties: { title, color },
          customProperties: [],
          createdByProfile: { userId: '', email: null, name: null, profileImageUrl: null },
        },
        parentId: undefined,
      };

      // Step 1: Update nodes with new positions/parentIds AND deselect them
      // This forces React Flow to refresh its selection cache
      // IMPORTANT: React Flow requires parent nodes to come BEFORE their children in the nodes array!
      setNodes(prev => {
        const childNodes = prev.map(n => {
          if (!variables.nodeIds.includes(n.id)) return n;
          const idx = variables.nodeIds.indexOf(n.id);
          const abs = absPositions[idx]!;
          const rel = { x: abs.x - minX, y: abs.y - minY };
          return {
            ...n,
            parentId: tempGroupId,
            position: rel,
            selected: false, // Deselect to refresh React Flow's selection cache
            data: { ...n.data, parentBlockMountId: tempGroupId },
          };
        });
        
        // 부모(그룹) 노드를 자식들보다 먼저 배열에 배치해야 함
        // 다른 노드들 중 그룹화되지 않은 것들을 분리
        const nonGroupedNodes = childNodes.filter(n => !variables.nodeIds.includes(n.id));
        const groupedNodes = childNodes.filter(n => variables.nodeIds.includes(n.id));
        
        // 순서: [그룹화되지 않은 노드들] + [그룹 노드] + [그룹의 자식 노드들]
        return [...nonGroupedNodes, groupNode, ...groupedNodes];
      });

      // Step 2: Reselect the nodes with updated data
      // This ensures the selection bounding box uses the new positions
      setTimeout(() => {
        setNodes(prev =>
          prev.map(n => ({
            ...n,
            selected: variables.nodeIds.includes(n.id) || n.id === tempGroupId,
          }))
        );
      }, 0);

      return { tempGroupId, previousChildren };
    },
    onError: (_err, _variables, context) => {
      if (!context) return;
      setNodes(prev => {
        let next = prev.filter(n => n.id !== context.tempGroupId);
        next = next.map(n => {
          const c = context.previousChildren.find(ch => ch.id === n.id);
          if (!c) return n;
          return {
            ...n,
            parentId: c.parentId,
            position: c.position,
            data: { ...n.data, parentBlockMountId: c.parentBlockMountId },
          };
        });
        return next;
      });
    },
    onSuccess: (data, _variables, context) => {
      const realId = data.groupBlockMountId;

      if (!context) return;
      setNodes(prev =>
        prev.map(n => {
          if (n.id === context.tempGroupId)
            return { ...n, id: realId, data: { ...n.data, blockMountId: realId } };
          if (n.parentId === context.tempGroupId)
            return { ...n, parentId: realId, data: { ...n.data, parentBlockMountId: realId } };
          return n;
        })
      );
    },
  });
}
