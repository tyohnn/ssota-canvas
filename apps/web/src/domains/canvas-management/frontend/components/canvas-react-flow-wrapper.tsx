'use client';

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  SelectionMode,
  type OnConnect,
  type Node,
  type Edge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { isFailure } from '@/lib/action-result';
import {
  deleteBlockMountAction,
  deleteMultipleBlockMountsAction,
} from '../../actions/block.actions';

// Type imports
import type { CustomNodeType } from '../acl/react-flow.acl';

// Canvas Management Hooks
import { useCanvasMode } from '../hooks/use-canvas-mode';
import { useCanvasSelection } from '../hooks/use-canvas-selection';
import { useCanvasViewport } from '../hooks/use-canvas-viewport';
import { useCanvasBlockTransform } from '../hooks/use-canvas-block-transform';
import { useCanvasSnapGuides } from '../hooks/use-canvas-snap-guides';
import { useCanvasEdgeManagement } from '../hooks/use-canvas-edge-management';
import { useCanvasBlockLifecycle } from '../hooks/use-canvas-block-lifecycle';

// Canvas Management Components
import { CanvasToolbar } from './canvas-toolbar';
import { ViewportControls } from './viewport-controls';
import { SkeletonBlock } from './skeleton-block';
import { BlockAddDialog } from './block-add-dialog';
import { BasicBlockNode } from './basic-block-node';
import { SnapGuidelines } from './snap-guidelines';
import { MultiSelectionToolbar } from './multi-selection-toolbar';
import { BlockMountToolbar } from './block-mount-toolbar';
import { SelectionBoundingBox } from './selection-bounding-box';
import { CustomEdge } from './custom-edge';

interface CanvasReactFlowWrapperProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

/**
 * Canvas React Flow Wrapper (React Flow SSOT)
 *
 * React Flow를 직접 사용하여 캔버스를 렌더링하는 컴포넌트
 * - React Flow State가 SSOT (단일 진실 공급원)
 * - Hook에서 서버 액션 래핑 메서드 제공
 * - 콜백에서 DB 저장만 담당
 */
export function CanvasReactFlowWrapper({
  pageId,
  orgId,
  workspaceId,
  initialNodes,
  initialEdges,
}: CanvasReactFlowWrapperProps) {
  // 노드 데이터에 pageId, orgId, workspaceId 추가
  const enrichedNodes = React.useMemo(
    () =>
      initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          pageId,
          orgId,
          workspaceId,
        },
      })),
    [initialNodes, pageId, orgId, workspaceId]
  );

  // 엣지 데이터에 pageId 추가 (EdgeToolbar에서 사용)
  const enrichedEdges = React.useMemo(
    () =>
      initialEdges.map(edge => ({
        ...edge,
        type: 'custom', // 모든 엣지를 커스텀 엣지로 설정
        data: {
          ...edge.data,
          pageId,
          actualEdgeType: edge.type || 'default', // 실제 엣지 타입 저장
        },
      })),
    [initialEdges, pageId]
  );

  // React Flow 상태 관리 (SSOT)
  const [nodes, setNode, onNodesChange] = useNodesState(enrichedNodes);
  const [edges, setEdge, onEdgesChange] = useEdgesState(enrichedEdges);
  const reactFlowInstance = useReactFlow();

  // Canvas Management Hooks
  const canvasMode = useCanvasMode();
  const canvasSelection = useCanvasSelection();
  const canvasViewport = useCanvasViewport();
  const blockTransform = useCanvasBlockTransform({ pageId });
  const snapGuides = useCanvasSnapGuides();
  const edgeManagement = useCanvasEdgeManagement(pageId);
  const blockLifecycle = useCanvasBlockLifecycle({ pageId, orgId });

  // BlockAddDialog 상태 관리
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  // 노드 타입 정의
  const nodeTypes = React.useMemo(
    () => ({
      basic: BasicBlockNode,
      // 다른 블록 타입들도 여기에 추가 가능
    }),
    []
  );

  // 엣지 타입 정의
  const edgeTypes = React.useMemo(
    () => ({
      custom: CustomEdge,
      // 다른 엣지 타입들도 여기에 추가 가능
    }),
    []
  );

  // 블럭 타입 선택 핸들러
  const handleSelectBlockType = React.useCallback(
    (blockType: string) => {
      setShowAddDialog(false);
      // 선택된 블럭 타입으로 생성 모드 진입
      canvasMode.enterBlockCreationMode(blockType);
    },
    [canvasMode.enterBlockCreationMode]
  );

  /**
   * 드래그 시작 → 드래그 모드 진입 및 이전 가이드라인 초기화
   */
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      const draggedIds = draggedNodes.map(n => n.id);

      // 이전 가이드라인 초기화 (새 블럭 드래그 시 깨끗한 상태로 시작)
      snapGuides.hideGuidelines();

      canvasMode.enterDraggingMode(draggedIds);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasMode.enterDraggingMode, snapGuides.hideGuidelines]
  );

  /**
   * 드래그 중 → 스냅 가이드라인 실시간 업데이트 (표시만, 스냅은 dragStop에서)
   * React Flow Helper Lines 예제: https://reactflow.dev/examples/interaction/helper-lines
   */
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      // 단일 블럭 드래그 시에만 스냅 가이드라인 표시 (스냅은 적용하지 않음)
      if (draggedNodes.length === 1) {
        const currentNodes = reactFlowInstance.getNodes();
        // 가이드라인만 계산하고 표시 (position은 변경하지 않음)
        snapGuides.calculateSnapGuides(node.id, node.position, currentNodes);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapGuides.calculateSnapGuides]
  );

  /**
   * 드래그 종료 → 스냅 적용 및 위치 서버 저장
   */
  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      let finalPosition = node.position;

      // 1. 단일 블럭인 경우 최종 스냅 위치 계산 및 적용
      if (draggedNodes.length === 1) {
        const currentNodes = reactFlowInstance.getNodes();
        const snapResult = snapGuides.calculateSnapGuides(
          node.id,
          node.position,
          currentNodes
        );

        finalPosition = snapResult.position;

        // 스냅된 위치로 노드 업데이트
        if (
          snapResult.position.x !== node.position.x ||
          snapResult.position.y !== node.position.y
        ) {
          reactFlowInstance.setNodes(nodes =>
            nodes.map(n =>
              n.id === node.id ? { ...n, position: snapResult.position } : n
            )
          );
        }
      }

      // 2. 가이드라인 즉시 숨김 (서버 저장보다 먼저!)
      snapGuides.hideGuidelines();

      // 3. 이전 모드로 즉시 복귀 (서버 저장보다 먼저!)
      if (draggedNodes.length === 1) {
        canvasMode.enterSingleSelectionMode(draggedNodes[0]!.id);
      } else {
        canvasMode.enterMultiSelectionMode(draggedNodes.map(n => n.id));
      }

      // 4. 서버 저장 (백그라운드, UI 블로킹 없음)
      // await을 제거하고 Promise를 백그라운드에서 실행
      if (draggedNodes.length === 1) {
        blockTransform.saveBlockPosition(node.id, finalPosition).catch(err => {
          console.error('[Canvas] Failed to save position:', err);
        });
      } else {
        // 다중 선택인 경우 각 노드의 위치를 서버에 저장
        Promise.all(
          draggedNodes.map(draggedNode =>
            blockTransform.saveBlockPosition(
              draggedNode.id,
              draggedNode.position
            )
          )
        ).catch(err => {
          console.error('[Canvas] Failed to save positions:', err);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      blockTransform.saveBlockPosition,
      snapGuides.calculateSnapGuides,
      snapGuides.hideGuidelines,
      canvasMode.enterSingleSelectionMode,
      canvasMode.enterMultiSelectionMode,
    ]
  );

  /**
   * 리사이즈 종료 → 크기 서버 저장
   * Note: React Flow의 onNodesChange에서 dimension 변경을 감지하여 처리
   */
  const handleNodeResize = useCallback(
    async (nodeId: string, newWidth: number, newHeight: number) => {
      const newSize = {
        width: newWidth,
        height: newHeight,
      };

      await blockTransform.saveBlockSize(nodeId, newSize);
    },
    [blockTransform.saveBlockSize]
  );

  /**
   * 노드 클릭 → 단일 선택 모드 진입
   */
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Ctrl/Cmd + 클릭이 아닌 경우에만 단일 선택 모드로 전환
      if (!event.ctrlKey && !event.metaKey) {
        canvasMode.enterSingleSelectionMode(node.id);
      }
    },
    [canvasMode.enterSingleSelectionMode]
  );

  /**
   * 선택 변경 → 다중 선택 모드 진입
   */
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 1) {
        canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
      } else if (selectedNodes.length === 1) {
        canvasMode.enterSingleSelectionMode(selectedNodes[0]!.id);
      } else {
        canvasMode.exitToDefaultMode();
      }
    },
    [
      canvasMode.enterMultiSelectionMode,
      canvasMode.enterSingleSelectionMode,
      canvasMode.exitToDefaultMode,
    ]
  );

  /**
   * 빈 영역 클릭 → 기본 모드 복귀
   * Note: block-creation 모드일 때는 SkeletonBlock에서 블럭 생성을 처리하므로 여기서는 처리하지 않음
   */
  const onPaneClick = useCallback(() => {
    // block-creation 모드일 때는 SkeletonBlock 컴포넌트에서 처리
    if (canvasMode.isBlockCreationMode()) {
      return;
    }

    // React Flow 선택 상태를 명시적으로 해제
    reactFlowInstance.setNodes(nodes =>
      nodes.map(node => ({ ...node, selected: false }))
    );

    canvasMode.exitToDefaultMode();
  }, [
    canvasMode.exitToDefaultMode,
    canvasMode.isBlockCreationMode,
    reactFlowInstance,
  ]);

  /**
   * 엣지 연결 → 엣지 생성 및 서버 저장
   */
  const onConnect: OnConnect = useCallback(
    async connection => {
      console.log('[Canvas] onConnect:', {
        source: connection.source,
        target: connection.target,
      });

      // 1. 연결 유효성 확인
      if (!connection.source || !connection.target) {
        console.warn(
          '⚠️ [Canvas] Invalid connection: missing source or target'
        );
        return;
      }

      // 2. Optimistic UI로 엣지 생성
      // Hook 내부에서 blockMountId → blockId 변환 처리
      await edgeManagement.createEdge(
        connection.source, // blockMountId (React Flow 노드 ID)
        connection.target, // blockMountId (React Flow 노드 ID)
        'default' // 기본 타입, 나중에 사용자가 변경 가능
      );
    },
    [edgeManagement.createEdge]
  );

  /**
   * 노드 삭제 → 블럭 마운트 및 연결된 엣지 삭제
   * Story CM-008: Delete 키 또는 Backspace 키로 블럭 삭제
   *
   * 주의: React Flow가 이미 노드를 제거한 후 이 콜백을 호출하므로,
   * UI는 이미 제거된 상태이고 서버 액션만 호출하면 됨
   */
  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      // Optimistic 노드 필터링 (아직 서버에 저장되지 않음)
      const optimisticNodes = deletedNodes.filter(node =>
        node.id.startsWith('optimistic-')
      );
      const realNodes = deletedNodes.filter(
        node => !node.id.startsWith('optimistic-')
      );

      if (optimisticNodes.length > 0) {
      }

      // 실제 노드만 서버로 전송
      if (realNodes.length === 0) {
        return;
      }

      const blockMountIds = realNodes.map(node => node.id);

      try {
        if (blockMountIds.length === 1) {
          // 단일 블럭 삭제 - 직접 서버 액션 호출
          const result = await deleteBlockMountAction({
            blockMountId: blockMountIds[0]!,
            orgId,
            workspaceId,
            pageId,
          });

          if (result.success && result.data) {
            // 성공 시 로그 없음 (조용한 처리)
          } else if (isFailure(result)) {
            console.error('Block deletion failed:', result.error);
          }
        } else if (blockMountIds.length > 1) {
          // 다중 블럭 삭제 - 직접 서버 액션 호출
          const result = await deleteMultipleBlockMountsAction({
            blockMountIds,
            orgId,
            workspaceId,
            pageId,
          });

          if (result.success && result.data) {
            // 성공 시 로그 없음 (조용한 처리)
          } else if (isFailure(result)) {
            console.error('Multiple blocks deletion failed:', result.error);
          }
        }
      } catch (error) {
        console.error('Block deletion error:', error);
      }
    },
    [workspaceId, pageId, orgId]
  );

  // 키보드 이벤트 핸들러 (Ctrl+D 복제)
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Ctrl+D 또는 Cmd+D (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();

        const selectedBlocks = canvasSelection.getSelectedBlocks();
        if (selectedBlocks.length === 0) {
          return;
        }

        // 선택된 블럭들을 복제
        selectedBlocks.forEach(async blockId => {
          const selectedNode = nodes.find(node => node.id === blockId);
          const blockMountId = (selectedNode?.data as any)?.blockMountId;
          if (!blockMountId) {
            return;
          }

          try {
            // 블럭 너비 + 50px 오프셋 계산
            const blockWidth = selectedNode?.width || 200; // 기본 너비 200px
            const offsetX = blockWidth + 50;
            const offsetY = 20; // Y축은 기본 20px

            await blockLifecycle.duplicateBlock(
              blockMountId,
              workspaceId,
              offsetX,
              offsetY
            );
          } catch (error) {
            console.error(`Failed to duplicate block ${blockId}:`, error);
          }
        });
      }
    },
    [canvasSelection, nodes, blockLifecycle, workspaceId]
  );

  // 트랙패드 제스처 최적화 설정 (피그마 스타일)
  // - 핀치 제스처: 줌인/줌아웃
  // - 두 손가락 스크롤: 캔버스 패닝

  return (
    <div className="h-full w-full relative">
      {/* React Flow 기본 선택 박스 스타일링 */}
      <style jsx global>{`
        /* 선택 드래그 프리뷰 박스 (파란색 반투명) */
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.08) !important;
          border: 1px dashed rgb(59, 130, 246) !important;
        }

        /* 선택된 노드들을 감싸는 박스는 우리 커스텀 컴포넌트 사용 */
        .react-flow__nodesselection {
          display: none !important;
        }

        /* React Flow 기본 선택 스타일 제거 (우리 커스텀 스타일 사용) */
        .react-flow__node.selected,
        .react-flow__node.selectable:focus,
        .react-flow__node.selectable:focus-visible {
          outline: none !important;
        }

        /* React Flow 기본 호버 스타일 제거 */
        .react-flow__node:hover {
          /* 우리 커스텀 호버 스타일 사용 */
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // 기본 설정
        fitView
        minZoom={0.1}
        maxZoom={2}
        // 상호작용 설정
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Full}
        // 트랙패드 제스처 설정 (피그마 스타일)
        panOnDrag={false} // 드래그는 선택 용도로만 사용
        panOnScroll={true} // 두 손가락 스크롤로 패닝
        zoomOnScroll={false} // 스크롤로 줌 비활성화
        zoomOnPinch={true} // 핀치 제스처로 줌 활성화
        // 이벤트 핸들러 (CM-003, CM-007 추가)
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onKeyDown={onKeyDown}
        deleteKeyCode={['Delete', 'Backspace']}
        className="bg-gray-50"
      >
        <Background />

        {/* 캔버스 상단 툴바 - Panel로 ReactFlow 내부로 이동 */}
        {/* z-index: 블럭(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
        <Panel position="top-center" className="!m-0 !pointer-events-auto z-10">
          <CanvasToolbar
            pageId={pageId}
            onAddBlockClick={() => setShowAddDialog(true)}
          />
        </Panel>

        {/* 모드별 컴포넌트 렌더링 */}
        {canvasMode.isBlockCreationMode() && (
          <SkeletonBlock
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
        )}

        {canvasMode.isMultiSelectionMode() && (
          <>
            <MultiSelectionToolbar
              pageId={pageId}
              orgId={orgId}
              workspaceId={workspaceId}
            />
            <SelectionBoundingBox pageId={pageId} />
          </>
        )}

        {/* 단일 선택 모드에서 BlockMountToolbar 표시 */}
        {canvasMode.isSingleSelectionMode() && (
          <BlockMountToolbar
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
        )}

        {/* 항상 렌더링하고 내부에서 조건 체크 (상태 업데이트 타이밍 이슈 방지) */}
        <SnapGuidelines guidelines={snapGuides.guidelines} />

        {/* 우측 하단 뷰포트 컨트롤 - Panel로 감싸서 React Flow 이벤트 시스템 통합 */}
        <Panel
          position="bottom-right"
          className="!mr-4 !mb-4 !pointer-events-auto"
        >
          <ViewportControls />
        </Panel>
      </ReactFlow>

      {/* Block Add Dialog (캔버스 밖에 위치) */}
      <BlockAddDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelectBlockType={handleSelectBlockType}
        workspaceId={workspaceId}
      />
    </div>
  );
}
