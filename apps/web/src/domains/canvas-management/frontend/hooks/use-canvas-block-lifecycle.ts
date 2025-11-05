'use client';

import React, { useCallback } from 'react';
import { useReactFlow, type Node } from '@xyflow/react';
import {
  createAndMountBlockAction,
  duplicateBlockAndMountAction,
  softDeleteBlockMountAction,
} from '../../actions/block.actions';
import { useCanvasMode } from '../contexts/canvas-mode-context';
import { isFailure } from '@/lib/action-result';
import type { BlockNodeData } from '../../../block-management/shared/types/block-data.types';
import { buildBlockNodeData } from '../../../block-management/shared/types/block-data.types';
import {
  BlockType,
  getBlockSize,
} from '../../../block-management/shared/types/block-types';
import {
  CreateAndMountBlockRequestSchema,
  SoftDeleteBlockMountRequestSchema,
  DuplicateBlockAndMountRequestSchema,
  type CreateAndMountBlockRequestInput,
  type SoftDeleteBlockMountRequestInput,
  type DuplicateBlockAndMountRequestInput,
} from '../../shared/dtos/requests';
import type { Position, Size } from '../../shared/types/common.types';
import { CustomNodeType } from '../acl/react-flow.acl';
import type { ActionResult } from '@/lib/action-result';
import type {
  BlockCreatedAndMountedDTO,
  BlockDuplicatedAndMountedDTO,
} from '../../shared/dtos/responses';

export interface UseCanvasBlockLifecycleParams {
  pageId: string;
  orgId: string;
  workspaceId: string;
}

// BlockData 인터페이스 제거 - React Flow Node 타입을 직접 사용

export interface UseCanvasBlockLifecycleResult {
  // Optimistic UI 제어 (사용자 액션, AI Tool Call)
  createAndMountBlock: (
    blockType: BlockType,
    position: Position
  ) => Promise<void>;
  softDeleteBlockMounts: (blockMountIds: string | string[]) => Promise<void>;
  duplicateBlockAndMount: (
    blockMountId: string,
    offsetX?: number,
    offsetY?: number
  ) => Promise<void>;
  duplicateMultipleBlocksAndMount: (
    blocks: Array<{
      blockMountId: string;
      offsetX?: number;
      offsetY?: number;
    }>
  ) => Promise<void>;

  // 프로그램적 제어 (UI만 변경, 서버 호출 X)
  addBlockToCanvas: (
    blockId: string,
    nodeData: BlockNodeData,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void;
  removeBlockFromCanvas: (blockId: string) => void;

  // 상태 읽기
  getAllBlocks: () => any[];
  getBlockById: (blockId: string) => any | undefined;
  getBlockCount: () => number;
}

/**
 * Block 생명주기 관리 Hook (Layer 1)
 *
 * - Optimistic UI 패턴으로 블럭 생성/삭제 처리
 * - React Flow Store를 SSOT로 사용
 * - 서버 액션과의 동기화 처리
 */
export function useCanvasBlockLifecycle(
  params: UseCanvasBlockLifecycleParams
): UseCanvasBlockLifecycleResult {
  const { pageId, orgId, workspaceId } = params;

  // React Flow hooks
  const { addNodes, deleteElements, getNodes, updateNode, setNodes } =
    useReactFlow();

  // Canvas Mode hook
  const canvasMode = useCanvasMode();
  const {
    enterSingleSelectionMode,
    enterMultiSelectionMode,
    exitToDefaultMode,
    enterBlockEditingMode,
  } = canvasMode;

  // 중복 삭제 방지를 위한 Set (현재 삭제 진행 중인 blockMountId들)
  const deletingBlockMountsRef = React.useRef<Set<string>>(new Set());

  /**
   * 모든 블럭 조회
   */
  const getAllBlocks = useCallback(() => {
    return getNodes();
  }, [getNodes]);

  /**
   * 특정 블럭 조회
   */
  const getBlockById = useCallback(
    (blockId: string) => {
      const nodes = getNodes();
      return nodes.find(node => node.id === blockId);
    },
    [getNodes]
  );

  /**
   * 블럭 개수 조회
   */
  const getBlockCount = useCallback(() => {
    return getNodes().length;
  }, [getNodes]);

  /**
   * 고유한 Optimistic ID 생성
   */
  const generateOptimisticId = useCallback(() => {
    return `optimistic-${crypto.randomUUID()}`;
  }, []);

  /**
   * 프로그램적 제어: UI에만 블럭 추가 (서버 저장 X)
   */
  const addBlockToCanvas = useCallback(
    (
      blockId: string,
      nodeData: BlockNodeData,
      position: Position,
      size: Size
    ) => {
      const node = {
        id: nodeData.blockMountId || blockId,
        type: nodeData.blockType, // blockType을 노드 타입으로 사용
        position,
        data: nodeData,
        width: size.width,
        height: size.height,
        zIndex: 1,
      } as CustomNodeType; // React Flow Node 타입으로 캐스팅

      addNodes([node]);
    },
    [addNodes]
  );

  /**
   * 블록 생성 요청 검증
   */
  const validateCreateRequest = useCallback(
    (blockType: BlockType, position: Position) => {
      const rawRequest: CreateAndMountBlockRequestInput = {
        pageId,
        blockType,
        position,
        size: getBlockSize(blockType),
        workspaceId,
        orgId,
      };

      const parseResult =
        CreateAndMountBlockRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid block data:', {
          message: firstError?.message || 'Invalid block data',
          issues: parseResult.error.issues,
        });
        // TODO: toast.error로 사용자에게 피드백
        return null;
      }

      return parseResult.data;
    },
    [pageId, orgId, workspaceId]
  );

  /**
   * Optimistic 노드 생성
   */
  const createOptimisticNode = useCallback(
    (blockType: BlockType, position: Position, optimisticId: string) => {
      const blockSize = getBlockSize(blockType);
      const optimisticNodeData: BlockNodeData = buildBlockNodeData(blockType, {
        blockMountId: '',
        blockId: '',
        pageId,
        orgId,
        workspaceId,
      });

      return {
        id: optimisticId,
        type: blockType,
        position,
        data: optimisticNodeData,
        width: blockSize.width,
        height: blockSize.height,
        zIndex: 1,
      } as CustomNodeType;
    },
    [pageId, orgId, workspaceId]
  );

  /**
   * Optimistic 노드가 삭제된 경우 서버에서 생성된 블록을 삭제
   */
  const deleteCreatedBlockWhenOptimisticDeleted = useCallback(
    async (blockMountId: string) => {
      try {
        const rollbackRequest: SoftDeleteBlockMountRequestInput = {
          blockMountIds: [blockMountId],
          orgId: orgId!,
          workspaceId: workspaceId!,
        };

        const parseResult =
          SoftDeleteBlockMountRequestSchema.safeParse(rollbackRequest);

        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          console.error('[Rollback Validation] Invalid delete request:', {
            message: firstError?.message || 'Invalid rollback request',
            issues: parseResult.error.issues,
          });
          return false;
        }

        const rollbackResult = await softDeleteBlockMountAction(
          parseResult.data
        );

        if (rollbackResult.success) {
          return true;
        } else {
          console.error(
            '❌ Block creation rollback failed:',
            rollbackResult.error
          );
          return false;
        }
      } catch (rollbackError) {
        console.error('Failed to rollback block creation:', rollbackError);
        return false;
      }
    },
    [orgId, workspaceId]
  );

  /**
   * 블록 생성 실패 시 처리
   */
  const handleCreateAndMountBlockFailure = useCallback(
    (
      optimisticId: string,
      result: ActionResult<BlockCreatedAndMountedDTO> | Error
    ) => {
      // 임시 노드 제거
      deleteElements({ nodes: [{ id: optimisticId }] });
      // 기본 모드로 복귀
      exitToDefaultMode();
      // 에러 처리
      if (result instanceof Error) {
        console.error('Block creation error:', result);
      } else if (isFailure(result)) {
        console.error('Block creation failed:', result.error);
      } else {
        console.error('Block creation failed: Unknown error');
      }
    },
    [exitToDefaultMode]
  );

  /**
   * 블록 생성 성공 시 처리
   */
  const handleCreateAndMountBlockSuccess = useCallback(
    async (optimisticId: string, blockView: BlockCreatedAndMountedDTO) => {
      const currentNodes = getNodes();
      const optimisticNodeStillExists = currentNodes.some(
        node => node.id === optimisticId
      );

      if (!optimisticNodeStillExists) {
        // 사용자가 optimistic 노드를 삭제했음 → 서버에서 soft delete 처리
        await deleteCreatedBlockWhenOptimisticDeleted(blockView.blockMountId);
        exitToDefaultMode();
        return;
      }

      // optimistic 노드가 존재함 → 실제 데이터로 업데이트 (깜빡임 방지)
      const realNodeData: BlockNodeData = buildBlockNodeData(
        blockView.blockType,
        {
          blockMountId: blockView.blockMountId,
          blockId: blockView.blockId,
          pageId,
          orgId,
          workspaceId,
          properties: blockView.properties,
          customProperties: blockView.customProperties,
          createdByProfile: blockView.createdByProfile,
          createdAt: blockView.createdAt,
          updatedAt: blockView.updatedAt,
        }
      );

      // optimistic 노드를 실제 노드로 업데이트 (ID 변경 포함)
      setNodes(nodes =>
        nodes.map(node =>
          node.id === optimisticId
            ? ({
                ...node,
                id: blockView.blockMountId,
                type: blockView.blockType,
                position: blockView.position,
                data: realNodeData,
                width: blockView.size.width,
                height: blockView.size.height,
                zIndex: blockView.zOrder,
              } as CustomNodeType)
            : node
        )
      );

      // 단일 선택 모드로 전환
      enterSingleSelectionMode(blockView.blockMountId);
      // 자동으로 에디터 패널 열기
      enterBlockEditingMode(blockView.blockId);
    },
    [
      deleteCreatedBlockWhenOptimisticDeleted,
      enterSingleSelectionMode,
      enterBlockEditingMode,
      pageId,
      orgId,
      workspaceId,
    ]
  );

  /**
   * 블럭 생성 (Optimistic UI)
   */
  const createAndMountBlock = useCallback(
    async (blockType: BlockType, position: Position) => {
      const optimisticId = generateOptimisticId();

      try {
        // 1. 요청 검증
        const validatedRequest = validateCreateRequest(blockType, position);
        if (!validatedRequest) return;

        // 2. Optimistic UI - 임시 노드 생성 및 추가
        const optimisticNode = createOptimisticNode(
          blockType,
          position,
          optimisticId
        );
        addNodes([optimisticNode]);

        // 3. 서버 액션 호출
        const result = await createAndMountBlockAction(validatedRequest);

        // 4. 결과 처리
        if (result.success && result.data) {
          await handleCreateAndMountBlockSuccess(optimisticId, result.data);
        } else {
          handleCreateAndMountBlockFailure(optimisticId, result);
        }
      } catch (error) {
        // 예외 발생 시 처리
        handleCreateAndMountBlockFailure(optimisticId, error as Error);
      }
    },
    [
      generateOptimisticId,
      validateCreateRequest,
      createOptimisticNode,
      handleCreateAndMountBlockSuccess,
      handleCreateAndMountBlockFailure,
    ]
  );

  /**
   * 프로그램적 제어: UI에서만 블럭 제거 (서버 저장 X)
   */
  const removeBlockFromCanvas = useCallback((blockId: string) => {
    deleteElements({ nodes: [{ id: blockId }] });
  }, []);

  /**
   * 블록 마운트 삭제 실패 시 처리
   */
  const handleSoftDeleteBlockMountsFailure = useCallback(
    (realNodes: Node[], error: Error) => {
      // 실제 노드들만 복원 (optimistic 노드는 복원하지 않음)
      addNodes(realNodes);
      console.error('Blocks deletion error:', error);
    },
    []
  );

  /**
   * 블록 마운트 삭제 성공 시 처리
   */
  const handleSoftDeleteBlockMountsSuccess = useCallback(
    (result: any, realNodes: Node[], realBlockMountIds: string[]) => {
      // 성공한 ID들과 실패한 ID들 계산
      const successfulIds = result.data.deletedBlockMountIds;
      const failedIds = realBlockMountIds.filter(
        id => !successfulIds.includes(id)
      );

      // 실패한 노드들만 복원 (성공한 것들은 이미 UI에서 제거됨)
      if (failedIds.length > 0) {
        const failedNodes = realNodes.filter(node =>
          failedIds.includes(node.id)
        );
        addNodes(failedNodes);

        console.warn(`Some blocks failed to delete: ${failedIds.join(', ')}`);
      }

      // 기본 모드로 복귀
      exitToDefaultMode();
    },
    [exitToDefaultMode]
  );

  /**
   * 블록 마운트 ID 정규화 및 노드 분리
   */
  const normalizeAndSeparateNodes = useCallback(
    (
      blockMountIds: string | string[]
    ):
      | { shouldReturn: true; reason: string }
      | {
          shouldReturn: false;
          normalizedBlockMountIds: string[];
          nodesToDelete: Node[];
          optimisticNodes: Node[];
          realNodes: Node[];
          realBlockMountIds: string[];
        } => {
      // blockMountIds를 배열로 정규화
      const normalizedBlockMountIds = Array.isArray(blockMountIds)
        ? blockMountIds
        : [blockMountIds];

      // 삭제 전 노드들 백업 (롤백용)
      const nodesToDelete = getNodes().filter(node =>
        normalizedBlockMountIds.includes(node.id)
      );

      if (nodesToDelete.length === 0) {
        return { shouldReturn: true, reason: 'No nodes found to delete' };
      }

      // Optimistic 노드와 실제 노드 분리 (충돌 방지)
      const optimisticNodes = nodesToDelete.filter(node =>
        node.id.startsWith('optimistic-')
      );
      const realNodes = nodesToDelete.filter(
        node => !node.id.startsWith('optimistic-')
      );

      return {
        shouldReturn: false,
        normalizedBlockMountIds,
        nodesToDelete,
        optimisticNodes,
        realNodes,
        realBlockMountIds: realNodes.map(node => node.id),
      };
    },
    [getNodes]
  );

  /**
   * 블록 마운트 삭제 요청 검증
   */
  const validateSoftDeleteRequest = useCallback(
    (realBlockMountIds: string[]) => {
      const rawRequest: SoftDeleteBlockMountRequestInput = {
        blockMountIds: realBlockMountIds,
        orgId,
        workspaceId,
      };

      const parseResult =
        SoftDeleteBlockMountRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid delete request:', {
          message: firstError?.message || 'Invalid delete request',
          issues: parseResult.error.issues,
        });
        return { isValid: false, request: null };
      }

      return { isValid: true, request: parseResult.data };
    },
    [orgId, workspaceId]
  );

  /**
   * 블럭 마운트 삭제 (Optimistic UI)
   * Story CM-008 구현 - 단일/다중 블럭 마운트 삭제 통합
   * 실제로는 블록을 삭제하는 것이 아니라 캔버스에서 블록 마운트를 제거
   */
  const softDeleteBlockMounts = useCallback(
    async (blockMountIds: string | string[]) => {
      // 0. 중복 호출 방지 - 이미 삭제 진행 중인 블록은 건너뛰기
      const normalizedIds = Array.isArray(blockMountIds)
        ? blockMountIds
        : [blockMountIds];
      const alreadyDeleting = normalizedIds.filter(id =>
        deletingBlockMountsRef.current.has(id)
      );

      if (alreadyDeleting.length > 0) {
        return;
      }

      // 삭제 시작 표시
      normalizedIds.forEach(id => deletingBlockMountsRef.current.add(id));

      try {
        // 1. 노드 정규화 및 분리
        const nodeData = normalizeAndSeparateNodes(blockMountIds);

        if (nodeData.shouldReturn) {
          console.warn(
            '⚠️ [Frontend] softDeleteBlockMounts aborted:',
            nodeData.reason
          );
          return;
        }

        const { nodesToDelete, optimisticNodes, realNodes, realBlockMountIds } =
          nodeData;

        // Optimistic 노드만 있는 경우 서버 호출 없이 UI에서만 제거하고 종료
        if (realNodes.length === 0) {
          // optimistic 노드들만 UI에서 즉시 제거 (서버에 저장되지 않았으므로)
          deleteElements({
            nodes: optimisticNodes.map(node => ({ id: node.id })),
          });
          exitToDefaultMode();
          return;
        }

        // 2. 요청 검증
        const validation = validateSoftDeleteRequest(realBlockMountIds);
        if (!validation.isValid) {
          return;
        }

        // 3. 모든 노드를 UI에서 즉시 제거
        deleteElements({
          nodes: nodesToDelete.map(node => ({ id: node.id })),
        });

        // 4. 서버 액션 호출
        const result = await softDeleteBlockMountAction(validation.request!);

        // 5. 결과 처리
        if (result.success && result.data) {
          handleSoftDeleteBlockMountsSuccess(
            result,
            realNodes,
            realBlockMountIds
          );
        } else {
          handleSoftDeleteBlockMountsFailure(
            realNodes,
            new Error('Server deletion failed')
          );
        }
      } catch (error) {
        console.error('Failed to delete blocks:', error);
        // nodeData가 정의되어 있고 realNodes가 있는 경우에만 복원 시도
        const nodeData = normalizeAndSeparateNodes(blockMountIds);
        if (!nodeData.shouldReturn) {
          handleSoftDeleteBlockMountsFailure(
            nodeData.realNodes,
            error as Error
          );
        }
      } finally {
        // 삭제 완료 후 진행 중 표시 제거
        normalizedIds.forEach(id => deletingBlockMountsRef.current.delete(id));
      }
    },
    [
      normalizeAndSeparateNodes,
      validateSoftDeleteRequest,
      handleSoftDeleteBlockMountsSuccess,
      handleSoftDeleteBlockMountsFailure,
    ]
  );

  /**
   * 블록 복제 요청 검증
   */
  const validateDuplicateRequest = useCallback(
    (blockMountId: string, offsetX: number, offsetY: number) => {
      const rawRequest: DuplicateBlockAndMountRequestInput = {
        blockMountId,
        workspaceId,
        orgId,
        offsetX,
        offsetY,
      };

      const parseResult =
        DuplicateBlockAndMountRequestSchema.safeParse(rawRequest);

      if (!parseResult.success) {
        const firstError = parseResult.error.issues[0];
        console.error('[Frontend Validation] Invalid duplicate request:', {
          message: firstError?.message || 'Invalid duplicate request',
          issues: parseResult.error.issues,
        });
        return { isValid: false, request: null };
      }

      return { isValid: true, request: parseResult.data };
    },
    [orgId, workspaceId]
  );

  /**
   * Optimistic 복제 노드 생성
   */
  const createOptimisticDuplicateNode = useCallback(
    (
      originalNode: Node,
      originalNodeData: BlockNodeData,
      offsetX: number,
      offsetY: number,
      optimisticId: string
    ) => {
      const optimisticBlockMountId = `optimistic-${optimisticId}`;
      const duplicatedPosition = {
        x: originalNode.position.x + offsetX,
        y: originalNode.position.y + offsetY,
      };

      const optimisticNodeData: BlockNodeData = buildBlockNodeData(
        originalNodeData.blockType,
        {
          blockMountId: optimisticBlockMountId,
          blockId: optimisticId,
          pageId,
          orgId,
          workspaceId,
          properties: originalNodeData.properties,
          customProperties: originalNodeData.customProperties,
        }
      );

      return {
        optimisticBlockMountId,
        optimisticNodeData,
        duplicatedPosition,
        size: {
          width: originalNode.width || 200,
          height: originalNode.height || 150,
        },
      };
    },
    [pageId, orgId, workspaceId]
  );

  /**
   * 복제된 블럭 선택 처리
   */
  const selectDuplicatedBlock = useCallback(
    (blockMountId: string) => {
      setTimeout(() => {
        // 모든 노드의 선택 상태를 해제하고 복제된 블럭만 선택 (한 번의 setNodes 호출로 처리)
        setNodes(nodes =>
          nodes.map(node =>
            node.id === blockMountId
              ? { ...node, selected: true }
              : { ...node, selected: false }
          )
        );

        // Canvas Mode도 업데이트
        canvasMode.enterSingleSelectionMode(blockMountId);
      }, 100);
    },
    [setNodes, canvasMode]
  );

  /**
   * 블록 복제 실패 시 처리
   */
  const handleDuplicateBlockFailure = useCallback(
    (optimisticBlockMountId: string, error: Error) => {
      // Optimistic 블럭 제거
      deleteElements({ nodes: [{ id: optimisticBlockMountId }] });
      exitToDefaultMode();
      console.error('Block duplication error:', error);
    },
    [exitToDefaultMode]
  );

  /**
   * 블록 복제 성공 시 처리
   */
  const handleDuplicateBlockSuccess = useCallback(
    (
      optimisticBlockMountId: string,
      result: ActionResult<BlockDuplicatedAndMountedDTO>,
      originalBlockType: BlockType,
      shouldSelect: boolean = true // 단일 선택 모드로 전환할지 여부
    ) => {
      if (!result.success || !result.data) {
        handleDuplicateBlockFailure(
          optimisticBlockMountId,
          new Error('Server duplication failed')
        );
        return;
      }

      // Optimistic 노드에서 properties 가져오기 (원본 properties가 이미 들어있음)
      const currentNodes = getNodes();
      const optimisticNode = currentNodes.find(
        node => node.id === optimisticBlockMountId
      );
      const optimisticNodeData = optimisticNode?.data as
        | BlockNodeData
        | undefined;

      // 실제 블럭 데이터 생성 (optimistic 노드의 properties 사용)
      const realNodeData: BlockNodeData = buildBlockNodeData(
        originalBlockType,
        {
          blockMountId: result.data.duplicatedBlockMountId,
          blockId: result.data.duplicatedBlockId,
          pageId,
          orgId,
          workspaceId,
          properties: optimisticNodeData?.properties,
          customProperties: optimisticNodeData?.customProperties,
        }
      );

      // Optimistic 노드를 실제 노드로 교체 (한 번의 setNodes 호출로 처리)
      setNodes(nodes =>
        nodes.map(node => {
          if (node.id === optimisticBlockMountId) {
            // Optimistic 노드를 실제 노드로 교체
            return {
              ...node,
              id: result.data.duplicatedBlockMountId,
              data: realNodeData,
            } as CustomNodeType;
          }
          return node;
        })
      );

      // 실제 블럭으로 선택 상태 업데이트 (단일 선택 모드가 필요한 경우에만)
      if (shouldSelect) {
        selectDuplicatedBlock(result.data.duplicatedBlockMountId);
      }
    },
    [
      handleDuplicateBlockFailure,
      getNodes,
      setNodes,
      selectDuplicatedBlock,
      pageId,
      orgId,
      workspaceId,
    ]
  );

  /**
   * 여러 블럭 복제 (Optimistic UI - 배치 처리)
   */
  const duplicateMultipleBlocksAndMount = useCallback(
    async (
      blocks: Array<{
        blockMountId: string;
        offsetX?: number;
        offsetY?: number;
      }>
    ) => {
      if (blocks.length === 0) {
        return;
      }

      // 1. 원본 블럭 정보 조회
      const originalNodes = getNodes();
      const optimisticNodes: CustomNodeType[] = [];
      const duplicateRequests: Array<{
        optimisticBlockMountId: string;
        validation: { isValid: boolean; request: any };
        originalNodeData: BlockNodeData;
        originalBlockType: BlockType;
      }> = [];

      // 2. 모든 optimistic 노드 생성 (배치)
      for (const block of blocks) {
        const originalNode = originalNodes.find(
          node =>
            (node.data as BlockNodeData).blockMountId === block.blockMountId
        );
        const originalNodeData = originalNode?.data as BlockNodeData;

        if (!originalNode) {
          console.error(
            `Original block not found for duplication: ${block.blockMountId}`
          );
          continue;
        }

        // 요청 검증
        const validation = validateDuplicateRequest(
          block.blockMountId,
          block.offsetX || 20,
          block.offsetY || 20
        );
        if (!validation.isValid) {
          continue;
        }

        // Optimistic ID 생성
        const optimisticId = generateOptimisticId();

        // Optimistic 복제 노드 생성
        const optimisticData = createOptimisticDuplicateNode(
          originalNode,
          originalNodeData,
          block.offsetX || 20,
          block.offsetY || 20,
          optimisticId
        );

        // 노드 생성
        const node = {
          id: optimisticData.optimisticBlockMountId,
          type: originalNodeData.blockType,
          position: optimisticData.duplicatedPosition,
          data: optimisticData.optimisticNodeData,
          width: optimisticData.size.width,
          height: optimisticData.size.height,
          zIndex: 1,
        } as CustomNodeType;

        optimisticNodes.push(node);
        duplicateRequests.push({
          optimisticBlockMountId: optimisticData.optimisticBlockMountId,
          validation,
          originalNodeData,
          originalBlockType: originalNodeData.blockType,
        });
      }

      if (optimisticNodes.length === 0) {
        return;
      }

      // 3. 모든 optimistic 노드를 한 번에 추가
      addNodes(optimisticNodes);

      // 3-1. 복제된 모든 블럭을 한 번에 멀티 셀렉션 모드로 선택
      const optimisticBlockMountIds = optimisticNodes.map(node => node.id);
      setTimeout(() => {
        // 모든 노드의 선택 상태를 업데이트 (복제된 블럭만 선택)
        setNodes(nodes =>
          nodes.map(node =>
            optimisticBlockMountIds.includes(node.id)
              ? { ...node, selected: true }
              : { ...node, selected: false }
          )
        );

        // Canvas Mode를 멀티 셀렉션 모드로 전환
        canvasMode.enterMultiSelectionMode(optimisticBlockMountIds);
      }, 100);

      // 4. 서버 요청 병렬 처리 및 실제 블럭 ID 추적
      const actualBlockMountIds: string[] = [];

      const serverPromises = duplicateRequests.map(
        async ({
          optimisticBlockMountId,
          validation,
          originalNodeData,
          originalBlockType,
        }) => {
          try {
            const result = await duplicateBlockAndMountAction(
              validation.request!
            );

            if (result.success && result.data) {
              // 실제 블럭 ID 수집
              actualBlockMountIds.push(result.data.duplicatedBlockMountId);

              handleDuplicateBlockSuccess(
                optimisticBlockMountId,
                result,
                originalBlockType,
                false // 멀티 셀렉션 처리 플래그
              );
            } else {
              handleDuplicateBlockFailure(
                optimisticBlockMountId,
                new Error('Server duplication failed')
              );
            }
          } catch (error) {
            handleDuplicateBlockFailure(optimisticBlockMountId, error as Error);
          }
        }
      );

      // 5. 모든 요청 완료 대기
      await Promise.allSettled(serverPromises);

      // 6. 모든 실제 블럭이 준비되면 멀티 셀렉션 모드로 전환
      if (actualBlockMountIds.length > 0) {
        setTimeout(() => {
          // 모든 노드의 선택 상태를 업데이트 (실제 복제된 블럭만 선택)
          setNodes(nodes =>
            nodes.map(node =>
              actualBlockMountIds.includes(node.id)
                ? { ...node, selected: true }
                : { ...node, selected: false }
            )
          );

          // Canvas Mode를 멀티 셀렉션 모드로 전환
          canvasMode.enterMultiSelectionMode(actualBlockMountIds);
        }, 100);
      }
    },
    [
      getNodes,
      validateDuplicateRequest,
      generateOptimisticId,
      createOptimisticDuplicateNode,
      addNodes,
      setNodes,
      canvasMode,
      handleDuplicateBlockSuccess,
      handleDuplicateBlockFailure,
    ]
  );

  /**
   * 블럭 복제 (Optimistic UI)
   */
  const duplicateBlockAndMount = useCallback(
    async (
      blockMountId: string,
      offsetX: number = 20,
      offsetY: number = 20
    ) => {
      // 1. 원본 블럭 정보 조회
      const originalNodes = getNodes();
      const originalNode = originalNodes.find(
        node => (node.data as BlockNodeData).blockMountId === blockMountId
      );
      const originalNodeData = originalNode?.data as BlockNodeData;

      if (!originalNode) {
        console.error('Original block not found for duplication');
        return;
      }

      // 2. 요청 검증
      const validation = validateDuplicateRequest(
        blockMountId,
        offsetX,
        offsetY
      );
      if (!validation.isValid) {
        return;
      }

      // 3. Optimistic ID 생성
      const optimisticId = generateOptimisticId();

      // 4. Optimistic 복제 노드 생성
      const optimisticData = createOptimisticDuplicateNode(
        originalNode,
        originalNodeData,
        offsetX,
        offsetY,
        optimisticId
      );

      // 5. 즉시 UI에 복제된 블럭 추가 (Optimistic UI)
      addBlockToCanvas(
        optimisticId,
        optimisticData.optimisticNodeData,
        optimisticData.duplicatedPosition,
        optimisticData.size
      );

      // 6. 복제된 블럭을 자동으로 선택
      selectDuplicatedBlock(optimisticData.optimisticBlockMountId);

      try {
        // 7. 서버에 복제 요청
        const result = await duplicateBlockAndMountAction(validation.request!);

        // 8. 결과 처리
        if (result.success && result.data) {
          handleDuplicateBlockSuccess(
            optimisticData.optimisticBlockMountId,
            result,
            originalNodeData.blockType
          );
        } else {
          handleDuplicateBlockFailure(
            optimisticData.optimisticBlockMountId,
            new Error('Server duplication failed')
          );
        }
      } catch (error) {
        handleDuplicateBlockFailure(
          optimisticData.optimisticBlockMountId,
          error as Error
        );
      }
    },
    [
      validateDuplicateRequest,
      createOptimisticDuplicateNode,
      addBlockToCanvas,
      selectDuplicatedBlock,
      handleDuplicateBlockSuccess,
      handleDuplicateBlockFailure,
    ]
  );

  return {
    createAndMountBlock,
    softDeleteBlockMounts,
    duplicateBlockAndMount,
    duplicateMultipleBlocksAndMount,
    addBlockToCanvas,
    removeBlockFromCanvas,
    getAllBlocks,
    getBlockById,
    getBlockCount,
  };
}
