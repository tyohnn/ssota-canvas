'use client';

import { Block, BlockType } from '@/db/schema';
import { useCallback } from 'react';
import { generateUUID } from '@/utils/uuid';
import { useReactFlowSelectionCommands } from '../contexts/ReactFlowSelectionContext';
import { useReactFlow, Node } from '@xyflow/react';
import { CreateStatus } from './useReactFlowBlockCommands';
import {
  createBlock as createBlockAction,
  updateBlock as updateBlockAction,
} from '@/domains/canvas/actions/block.action';
import { useOrganizationContext } from '@/domains/dashboard/context/OrganizationCotext';
import {
  createBlockPosition as createBlockPositionAction,
  batchUpdateBlockPositions,
} from '@/domains/canvas/actions/block-position.action';
import { isFailure } from '@/lib/action-result';
import { generateInitialNodeMetadata } from '../policy/node-addition-policy';
import { FormSchema, NodeUI } from '@/domains/blocks/types';
import { createDbUpdatePayload } from '@/lib/object-utils';
import { extractUserDefinedSchema } from '../policy/node-form-schema-policy';

/**
 * React Flow Node Commands Hook
 *
 * This hook handles node operations like creation, deletion, duplication,
 * position updates, and other node-specific commands.
 * Uses React Flow nodes as SSOT with optimistic updates.
 */
export function useReactFlowNodeCommands() {
  const { addNodes, deleteElements, updateNode, getNode } = useReactFlow();
  const { selectNodes } = useReactFlowSelectionCommands();
  const { activeWorkspace } = useOrganizationContext();

  // ============================================================================
  // Node Creation
  // ============================================================================

  /**
   * Create a new node in the canvas
   */
  const createNode = useCallback(
    async (
      parentBlockId: string,
      nodeType: string,
      position: { x: number; y: number }
    ): Promise<CreateStatus> => {
      if (!activeWorkspace) {
        return { ok: false, error: 'No active workspace' };
      }

      const optimisticId = generateUUID();
      const now = new Date();

      try {
        // 1. Create optimistic node with type-specific initial metadata
        const initialMetadata = generateInitialNodeMetadata(
          nodeType as BlockType
        );

        const optimisticNode = {
          id: optimisticId,
          type: nodeType,
          position,
          data: {
            slug: `block-${optimisticId.substring(0, 8)}-${now.getTime()}`,
            title: `${nodeType}`,
            workspace_id: activeWorkspace.id,
            parent_block_id: parentBlockId,
            object: 'block',
            order: 0,
            icon_name: 'block',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            formData: initialMetadata.formData,
            formSchema: initialMetadata.formSchema,
            nodeUI: initialMetadata.nodeUI,
          },
          width: initialMetadata.nodeUI.size.width,
          // height: initialMetadata.nodeUI.size.height,
        };

        // 2. Add to React Flow (optimistic update)
        addNodes([optimisticNode]);

        // 4. Sync to database
        const dbResult = await createBlockAction({
          blockType: nodeType as BlockType,
          slug: optimisticNode.data.slug,
          title: optimisticNode.data.title,
          workspaceId: optimisticNode.data.workspace_id,
          parentBlockId: optimisticNode.data.parent_block_id,
          object: optimisticNode.data.object as 'block' | 'page' | 'component',
          order: optimisticNode.data.order,
          icon_name: optimisticNode.data.icon_name,
          metadata: {
            formData: {},
            formSchema: {
              fields: [],
            }, // 빈 객체로 저장 (기본 스키마는 메모리에서 관리)
            nodeUI: optimisticNode.data.nodeUI,
          },
        });

        if (isFailure(dbResult)) {
          // Rollback optimistic update
          deleteElements({ nodes: [{ id: optimisticId }] });
          return {
            ok: false,
            error: dbResult.error || 'Failed to create node in database',
          };
        }

        const dbNode = dbResult.data as Block;

        const blockPositionResult = await createBlockPositionAction({
          blockId: dbNode.id,
          contextBlockId: parentBlockId,
          x: position.x,
          y: position.y,
        });

        if (isFailure(blockPositionResult)) {
          // Rollback optimistic update
          deleteElements({ nodes: [{ id: optimisticId }] });
          return {
            ok: false,
            error:
              blockPositionResult.error || 'Failed to create node in database',
          };
        }

        // 5. Reconcile with database ID
        const reconciledNode = {
          ...optimisticNode,
          id: dbNode.id,
          data: {
            ...optimisticNode.data,
            created_at: dbNode.created_at.toISOString(),
            updated_at: dbNode.updated_at.toISOString(),
          },
        };

        // Update node with real ID
        updateNode(optimisticId, reconciledNode);
        selectNodes([dbNode.id]);

        return { ok: true, data: { nodeId: dbNode.id } };
      } catch (error) {
        console.error('❌ Failed to create node:', error);
        return {
          ok: false,
          error: `Failed to create node: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
    [addNodes, deleteElements, updateNode, selectNodes, activeWorkspace]
  );

  // ============================================================================
  // Node Position Updates
  // ============================================================================

  /**
   * Batch update multiple node positions
   */
  const updateNodePositions = useCallback(
    async (
      parentBlockId: string,
      positions: {
        node: Node | Pick<Node, 'id' | 'type' | 'data'>;
        x: number;
        y: number;
      }[]
    ): Promise<CreateStatus> => {
      if (!parentBlockId) {
        return { ok: false, error: 'No parent block' };
      }

      if (positions.length === 0) {
        return { ok: true };
      }

      // Store original positions for rollback
      // optimistic update과 rollback을 위해서는, onNodeDragStart에서 초기 포지션을 state에 저장하고, 여기서 활용해야 함.
      // 이미 onDragStop에서 position이 업데이트된 상태로 넘어온거라, 의미가 없음.
      // const originalPositions = positions.map(pos => {
      //   const node = getNode(pos.id);
      //   return {
      //     id: pos.id,
      //     position: node ? { x: node.position.x, y: node.position.y } : null
      //   };
      // });

      try {
        // 1. Update React Flow Nodes immediately (optimistic update)
        positions.forEach(pos => {
          updateNode(pos.node.id, { position: { x: pos.x, y: pos.y } });
        });

        // 2. Sync to database
        const dbResult = await batchUpdateBlockPositions({
          contextBlockId: parentBlockId,
          positions: positions.map(pos => ({
            blockId: pos.node.id,
            x: pos.x,
            y: pos.y,
          })),
        });

        if (isFailure(dbResult)) {
          // Rollback optimistic updates
          // originalPositions.forEach(({ id, position }) => {
          //   if (position) {
          //     updateNode(id, { position });
          //   }
          // });
          return {
            ok: false,
            error: dbResult.error || 'Failed to update positions in database',
          };
        }

        return { ok: true, data: { updatedCount: positions.length } };
      } catch (error) {
        // Rollback optimistic updates
        // originalPositions.forEach(({ id, position }) => {
        //   if (position) {
        //     updateNode(id, { position });
        //   }
        // });
        console.error('❌ Failed to update positions:', error);
        return {
          ok: false,
          error: `Failed to update positions: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
    [getNode, updateNode, activeWorkspace]
  );

  // ============================================================================
  // Node Duplication
  // ============================================================================

  /**
   * Duplicate a node
   */
  const duplicateNodes = useCallback(
    async (
      parentBlockId: string,
      sourceNodes: Node[],
      offset: { x: number; y: number } = { x: 100, y: 100 }
    ): Promise<CreateStatus> => {
      // offset 자동으로 계산하는 로직
      if (!activeWorkspace) {
        return { ok: false, error: 'No active workspace' };
      }

      if (sourceNodes.length === 0) {
        return { ok: false, error: 'No nodes to duplicate' };
      }

      const now = new Date();
      const duplicatedNodes: Node[] = [];
      const optimisticIds: string[] = [];

      try {
        // 1. Create duplicated nodes (optimistic update)
        for (const [index, sourceNode] of sourceNodes.entries()) {
          if (!sourceNode) {
            continue;
          }
          const optimisticId = generateUUID();
          optimisticIds.push(optimisticId);

          const duplicatedNode = {
            id: optimisticId,
            type: sourceNode.type,
            position: {
              x: sourceNode.position.x + offset.x * (index + 1),
              y: sourceNode.position.y + offset.y * (index + 1),
            },
            data: {
              ...sourceNode.data,
              slug: `block-${optimisticId.substring(0, 8)}-${now.getTime()}`,
              title: `${sourceNode.data.title || 'Node'} Copy`,
              workspace_id: sourceNode.data.workspace_id,
              parent_block_id: sourceNode.data.parent_block_id,
              object: sourceNode.data.object,
              order: sourceNode.data.order,
              icon_name: sourceNode.data.icon_name,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
              formData: sourceNode.data.formData,
              formSchema: sourceNode.data.formSchema,
              nodeUI: sourceNode.data.nodeUI,
            },
            width: sourceNode.width,
            // height: sourceNode.height,
          };

          duplicatedNodes.push(duplicatedNode);
        }

        // 2. Add to React Flow
        addNodes(duplicatedNodes);

        // 3. Select the duplicated nodes
        selectNodes(optimisticIds);

        // 4. Sync to database
        const dbResults = await Promise.all(
          duplicatedNodes.map(async (duplicatedNode, index) => {
            const sourceNode = sourceNodes[index]!; // We already filtered out undefined nodes
            const dbResult = await createBlockAction({
              blockType: sourceNode.type as BlockType,
              slug: duplicatedNode.data.slug as string,
              title: duplicatedNode.data.title as string,
              workspaceId: duplicatedNode.data.workspace_id as string,
              parentBlockId: duplicatedNode.data.parent_block_id as string,
              object: duplicatedNode.data.object as
                | 'block'
                | 'page'
                | 'component',
              order: duplicatedNode.data.order as number,
              icon_name: duplicatedNode.data.icon_name as string,
              metadata: {
                formData: duplicatedNode.data.formData,
                formSchema: duplicatedNode.data.formSchema,
                nodeUI: duplicatedNode.data.nodeUI,
              },
            });

            if (isFailure(dbResult)) {
              return { dbResult, blockPositionResult: null, index };
            }

            const dbNode = dbResult.data as Block;

            const blockPositionResult = await createBlockPositionAction({
              blockId: dbNode.id,
              contextBlockId: parentBlockId,
              x: duplicatedNode.position.x,
              y: duplicatedNode.position.y,
            });

            return { dbResult, blockPositionResult, index };
          })
        );

        // Check for failures
        const failedResults = dbResults.filter(
          ({ dbResult, blockPositionResult }) =>
            isFailure(dbResult) ||
            (blockPositionResult && isFailure(blockPositionResult))
        );

        if (failedResults.length > 0) {
          // Rollback optimistic updates
          deleteElements({ nodes: optimisticIds.map(id => ({ id })) });
          const errors = failedResults
            .map(
              ({ dbResult, blockPositionResult }) =>
                (isFailure(dbResult) ? dbResult.error : '') ||
                (blockPositionResult && isFailure(blockPositionResult)
                  ? blockPositionResult.error
                  : '')
            )
            .join(', ');
          return {
            ok: false,
            error: errors || 'Failed to create duplicated nodes in database',
          };
        }

        // 5. Reconcile with database IDs
        const reconciledIds: string[] = [];
        for (let i = 0; i < dbResults.length; i++) {
          const result = dbResults[i];
          if (!result || isFailure(result.dbResult)) continue;

          const dbNode = result.dbResult.data as Block;
          const optimisticId = optimisticIds[result.index];
          const duplicatedNode = duplicatedNodes[result.index];

          if (!optimisticId || !duplicatedNode) continue;

          const reconciledNode = {
            ...duplicatedNode,
            id: dbNode.id,
            data: {
              ...duplicatedNode.data,
              created_at: dbNode.created_at.toISOString(),
              updated_at: dbNode.updated_at.toISOString(),
            },
          };

          updateNode(optimisticId, reconciledNode);
          reconciledIds.push(dbNode.id);
        }

        selectNodes(reconciledIds);
        return { ok: true, data: { nodeIds: reconciledIds } };
      } catch (error) {
        console.error('❌ Failed to duplicate node:', error);
        return {
          ok: false,
          error: `Failed to duplicate node: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
    [
      getNode,
      addNodes,
      deleteElements,
      updateNode,
      selectNodes,
      activeWorkspace,
    ]
  );

  // ============================================================================
  // Node Deletion
  // ============================================================================

  /**
   * Delete a node
   */
  const deleteNodes = useCallback(
    async (nodes: Node[]): Promise<CreateStatus> => {
      if (nodes.length === 0) {
        return { ok: false, error: 'No nodes to delete' };
      }

      try {
        // 1. Remove from React Flow immediately (optimistic update)
        deleteElements({ nodes: nodes.map(node => ({ id: node.id })) });

        // 2. Sync to database (soft delete)
        const now = new Date();
        const dbResults = await Promise.all(
          nodes.map(async node => {
            const dbResult = await updateBlockAction({
              id: node.id,
              deleted_at: now,
            });
            return { dbResult, node };
          })
        );

        // Check for failures
        const failedResults = dbResults.filter(({ dbResult }) =>
          isFailure(dbResult)
        );
        if (failedResults.length > 0) {
          // Rollback optimistic updates
          addNodes(nodes);
          const errors = failedResults
            .map(({ dbResult }) => (isFailure(dbResult) ? dbResult.error : ''))
            .join(', ');
          return {
            ok: false,
            error: errors || 'Failed to delete nodes in database',
          };
        }

        console.log(
          '✅ Nodes deleted successfully:',
          nodes.map(node => node.id)
        );
        return { ok: true, data: { nodeIds: nodes.map(node => node.id) } };
      } catch (error) {
        // Rollback optimistic update
        addNodes(nodes);
        console.error('❌ Failed to delete nodes:', error);
        return {
          ok: false,
          error: `Failed to delete nodes: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
    [deleteElements, addNodes]
  );

  // ============================================================================
  // Node Data Updates
  // ============================================================================

  /**
   * Update node data with optimized database sync (Node object version)
   * Only updates the specific fields that changed to minimize database load
   */
  const updateNodeData = useCallback(
    async (
      node: Node | Pick<Node, 'id' | 'type' | 'data'>,
      updates: {
        title?: string;
        order?: number;
        icon_name?: string;
        formData?: Record<string, unknown>;
        formSchema?: FormSchema;
        nodeUI?: NodeUI;
        [key: string]: unknown;
      }
    ): Promise<CreateStatus> => {
      const originalData = { ...node.data };

      try {
        const newData = {
          ...node.data,
          ...updates,
        };
        // 1. Update React Flow Node immediately (optimistic update)
        updateNode(node.id, {
          data: newData,
        });

        // 컴포넌트 인스턴스인지 확인
        const isInstance = newData.role === 'instance' && newData.instanceData;

        // 컴포넌트 인스턴스가 아닌 경우에만 formSchema 추출
        const extractedFormSchema = !isInstance
          ? extractUserDefinedSchema(
              node.type as BlockType,
              newData.formSchema as FormSchema
            )
          : undefined;

        const { formData, formSchema, nodeUI, ...topLevelUpdates } = updates;

        // 2. Prepare optimized database update payload using utility function
        const existingMetadata = {
          formData: newData.formData || {},
          // 컴포넌트 인스턴스인 경우 기존 formSchema 유지 (빈 배열)
          formSchema: !isInstance
            ? extractedFormSchema || { fields: [] }
            : { fields: [] },
          nodeUI: newData.nodeUI || {},
          componentData: newData.componentData,
          pageData: newData.pageData,
          instanceData: newData.instanceData,
        };

        const dbUpdatePayload = createDbUpdatePayload<
          typeof topLevelUpdates,
          'title' | 'order' | 'icon_name',
          'formData' | 'formSchema' | 'nodeUI'
        >(
          topLevelUpdates,
          ['title', 'order', 'icon_name'], // top-level fields
          ['formData', 'formSchema', 'nodeUI'], // metadata fields
          existingMetadata // 올바른 existing metadata for merging and preserving structure
        );

        // 3. Sync to database with optimized payload
        const dbResult = await updateBlockAction({
          ...dbUpdatePayload,
          id: node.id,
        });

        if (isFailure(dbResult)) {
          // Rollback optimistic update
          updateNode(node.id, { data: originalData });
          return {
            ok: false,
            error: dbResult.error || 'Failed to update node data in database',
          };
        }

        return { ok: true, data: { nodeId: node.id, updates } };
      } catch (error) {
        // Rollback optimistic update
        updateNode(node.id, { data: originalData });
        console.error('❌ Failed to update node data:', error);
        return {
          ok: false,
          error: `Failed to update node data: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
    [updateNode]
  );

  /**
   * Update node data (nodeId version - backward compatibility)
   */
  const updateNodeDataById = useCallback(
    async (
      nodeId: string,
      updates: {
        title?: string;
        order?: number;
        icon_name?: string;
        formData?: Record<string, unknown>;
        formSchema?: FormSchema;
        nodeUI?: NodeUI;
        [key: string]: unknown;
      }
    ): Promise<CreateStatus> => {
      const node = getNode(nodeId);
      if (!node) {
        return { ok: false, error: `Node ${nodeId} not found` };
      }
      return updateNodeData(node, updates);
    },
    [getNode, updateNodeData]
  );

  return {
    // Node Creation
    createNode,

    // Node Position Updates
    updateNodePositions,

    // Node Duplication
    duplicateNodes,

    // Node Deletion
    deleteNodes,

    // Node Data Updates
    updateNodeData,
    updateNodeDataById,
  } as const;
}
