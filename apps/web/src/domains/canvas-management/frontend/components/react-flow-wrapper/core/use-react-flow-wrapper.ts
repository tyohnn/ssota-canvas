import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTheme } from 'next-themes';

import type { Edge, Node, OnConnect, OnReconnect } from '@xyflow/react';
import type { Position } from '@/domains/canvas-management/shared/types/common.types';
import { useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';

import {
  BLOCK_TYPE_SIZES,
  BlockType,
} from '@/domains/block-management/shared/types/block-types';
import { CANVAS_NODE_TYPES } from '@/domains/canvas-management/frontend/config/node-types.config';
import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { useCanvasSnapGuides } from '@/domains/canvas-management/frontend/hooks/control/use-canvas-snap-guides';
import { useGroupCollision } from '@/domains/canvas-management/frontend/hooks/group';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { useCanvasTransform } from '@/domains/canvas-management/frontend/hooks/use-canvas-transform';
import { useCanvasViewport } from '@/domains/canvas-management/frontend/hooks/use-canvas-viewport';
import { useCanvasHistory } from '@/domains/canvas-management/frontend/history';

import { CustomEdge } from '../components/custom-edge';
import {
  type ReactFlowWrapperBusinessLogic,
  useReactFlowWrapperBusiness,
} from './use-react-flow-wrapper.business';
import {
  type ReactFlowWrapperUIState,
  useReactFlowWrapperUI,
} from './use-react-flow-wrapper.ui';

/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies
 * and manages all component logic.
 */
export interface UseReactFlowWrapperProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export interface UseReactFlowWrapperReturn
  extends
  Omit<ReactFlowWrapperUIState, 'handleNodeDragStopUI'>,
  ReactFlowWrapperBusinessLogic {
  // React Flow State (SSOT)
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  nodeTypes: Record<string, React.ComponentType<any>>;
  edgeTypes: Record<string, React.ComponentType<any>>;

  // Theme
  colorMode: 'light' | 'dark';

  // Interaction settings
  panOnScrollEnabled: boolean;
  panOnDragEnabled: boolean;
  isBlockCreationMode: boolean;
  isPanningMode: boolean; // Used for key prop to force re-render

  // Viewport
  defaultViewport: { x: number; y: number; zoom: number };
  onMove: (
    event: unknown,
    viewport: { x: number; y: number; zoom: number }
  ) => void;

  // Drag callbacks (override UI State)
  onNodeDrag: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => void;
  onNodeDragStop: (
    event: React.MouseEvent,
    node: Node,
    draggedNodes: Node[]
  ) => Promise<void>;

  // Custom handlers (with block creation mode override)
  handlePaneClick: (event: React.MouseEvent) => void;
  handleNodeClick: (event: React.MouseEvent, node: Node) => void;
  handleSelectBlockType: (blockType: BlockType) => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleWheelCapture: (event: React.WheelEvent<HTMLDivElement>) => void;

  // Additional state from wrapper
  guidelines: any[];

  // Feature flags (readonly에 따라 자동 처리)
  showAIAgent: boolean;
  showBlockCreation: boolean;

  // History
  history: any;
  executeUndo: () => Promise<void>;
  executeRedo: () => Promise<void>;
}

export function useReactFlowWrapper(
  props: UseReactFlowWrapperProps,
  canvasMetadataOverride?: CanvasMetadata
): UseReactFlowWrapperReturn {
  // =========================================================================
  // 1. Gather External Dependencies and canvas metadata
  // =========================================================================
  const { initialNodes, initialEdges } = props;
  const { pageId } = useCanvasMetadata(canvasMetadataOverride);
  const { readonly } = useCanvasReadOnly();

  // =========================================================================
  // 2. React Flow State Management (SSOT)
  // =========================================================================
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const reactFlowInstance = useReactFlow();


  // =========================================================================
  // 3. Theme
  // =========================================================================
  const { theme } = useTheme();
  const colorMode = theme === 'dark' ? 'dark' : 'light';

  // =========================================================================
  // 4. Domain / Service Hooks (External Dependencies)
  // =========================================================================
  const canvasMode = useCanvasModeContext();
  const canvasSelection = useCanvasSelection();
  const snapGuides = useCanvasSnapGuides();

  const blockTransform = useCanvasTransform({
    pageId,
  });

  const edgeLifecycle = useCanvasEdgeLifecycle({
    pageId,
    reactFlow: {
      getEdges: reactFlowInstance.getEdges,
      setEdges: setEdges,
      getNodes: reactFlowInstance.getNodes,
    },
  });

  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
    reactFlow: {
      getNodes: reactFlowInstance.getNodes,
      setNodes: setNodes,
      addNodes: reactFlowInstance.addNodes,
      deleteElements: reactFlowInstance.deleteElements,
      updateNode: reactFlowInstance.updateNode,
    },
  });

  const canvasViewport = useCanvasViewport({
    pageId,
  });

  // Group collision detection (의존성 주입)
  const groupCollision = useGroupCollision({
    pageId,
    reactFlow: {
      getNodes: () => reactFlowInstance.getNodes(),
      setNodes: reactFlowInstance.setNodes,
    },
    groupActions: {
      addNodeToGroup: blockLifecycle.addNodeToGroup,
      removeNodeFromGroup: blockLifecycle.removeNodeFromGroup,
    },
  });

  // Canvas History
  const history = useCanvasHistory();

  const isProcessingRef = useRef(false);

  // Undo 실행
  const executeUndo = useCallback(async () => {
    if (isProcessingRef.current) return;
    
    const entry = history.getUndoEntry();
    if (!entry) {
      console.log('[CanvasHistory] Nothing to undo');
      return;
    }

    isProcessingRef.current = true;
    history.setIsSkipping(true); // Undo 중 발생하는 동작 기록 방지
    
    console.log('[Undo] Executing operations:', entry.operations);

    try {
      // 복구 시에는 블록을 먼저 살리고 엣지를 살려야 함 (의존성 때문)
      // 삭제 시에는 엣지를 먼저 지우고 블록을 지워야 함
      const sortedOperations = [...entry.operations].reverse().sort((a, b) => {
        // Undo 시: BLOCK_DELETE(복구)는 EDGE_DELETE(복구)보다 먼저
        if (a.type === 'BLOCK_DELETE' && b.type === 'EDGE_DELETE') return -1;
        if (a.type === 'EDGE_DELETE' && b.type === 'BLOCK_DELETE') return 1;
        
        // Undo 시: EDGE_ADD(삭제)는 BLOCK_ADD(삭제)보다 먼저 (사실 크게 상관없음)
        if (a.type === 'EDGE_ADD' && b.type === 'BLOCK_ADD') return -1;
        if (a.type === 'BLOCK_ADD' && b.type === 'EDGE_ADD') return 1;
        
        return 0;
      });

      for (const operation of sortedOperations) {
        switch (operation.type) {
          case 'BLOCK_ADD':
            // Undo: 생성된 블록 제거 (공식 명령을 써야 엣지까지 같이 지워짐)
            reactFlowInstance.deleteElements({ nodes: [{ id: operation.blockMountId }] });
            await blockLifecycle.softDeleteBlockMounts(operation.blockMountId);
            break;
          case 'BLOCK_DELETE':
            // Undo: 삭제된 블록을 UI에 다시 추가/갱신하고 서버에서도 복구
            setNodes(nodes => {
              const exists = nodes.some(n => n.id === operation.blockMountId);
              if (exists) {
                return nodes.map(n => n.id === operation.blockMountId ? operation.data.node : n);
              }
              return [...nodes, operation.data.node];
            });
            await blockLifecycle.restoreBlockMounts(operation.blockMountId);
            break;
          case 'BLOCK_MOVE':
            setNodes(nodes => 
              nodes.map(n => n.id === operation.blockMountId ? { ...n, position: operation.data.previousPosition } : n)
            );
            await blockTransform.updateBlockPosition({
              blockPositions: [{ blockMountId: operation.blockMountId, position: operation.data.previousPosition }]
            });
            break;
          case 'BLOCK_RESIZE':
            setNodes(nodes => 
              nodes.map(n => n.id === operation.blockMountId ? { 
                ...n, 
                width: operation.data.previousSize.width, 
                height: operation.data.previousSize.height 
              } : n)
            );
            await blockTransform.updateBlockSize({
              blockMountId: operation.blockMountId,
              newSize: operation.data.previousSize
            });
            break;
          case 'BLOCK_CONTENT_UPDATE':
            // Undo: 새 콘텐츠를 이전 콘텐츠로 되돌림
            setNodes(nodes => 
              nodes.map(n => {
                if (n.id === operation.blockMountId) {
                  const nodeData = n.data as any;
                  return { ...n, data: { ...nodeData, content: operation.data.previousContent } };
                }
                return n;
              })
            );
            break;
          case 'EDGE_ADD':
            // Undo: 생성된 엣지 제거
            reactFlowInstance.deleteElements({ edges: [{ id: operation.edgeId }] });
            await edgeLifecycle.deleteEdge({ edgeId: operation.edgeId });
            break;
          case 'EDGE_DELETE':
            // Undo: 삭제된 Edge를 다시 복구 (ID 보존)
            if (operation.data.edge) {
              setEdges(prev => [...prev, operation.data.edge]);
            }
            await edgeLifecycle.restoreEdges(operation.edgeId);
            break;
          case 'EDGE_RECONNECT':
            // Undo: "새 연결"을 "이전 연결"로 Updates (ID 유지)
            setEdges(edges => 
              edges.map(e => e.id === operation.edgeId ? { 
                ...e, 
                source: operation.data.previousSource, 
                target: operation.data.previousTarget,
                sourceHandle: operation.data.previousSourceHandle || undefined,
                targetHandle: operation.data.previousTargetHandle || undefined,
              } : e)
            );
            
            // 서버 업데이트 (단순 Update 호출)
            await edgeLifecycle.reconnectEdge({
              edgeId: operation.edgeId,
              newSourceBlockMountId: operation.data.previousSource,
              newTargetBlockMountId: operation.data.previousTarget,
              sourceHandle: operation.data.previousSourceHandle,
              targetHandle: operation.data.previousTargetHandle,
              skipOptimisticUpdate: true,
            });
            break;
        }
      }
      history.commitUndo();
    } catch (error) {
      console.error('[Undo] Error during execution:', error);
    } finally {
      setTimeout(() => {
        history.setIsSkipping(false);
        isProcessingRef.current = false;
        console.log('[Undo] Reset skipping and processing state');
      }, 300);
    }
  }, [history, reactFlowInstance, setNodes, setEdges, blockLifecycle, blockTransform, edgeLifecycle]);

  // Redo 실행
  const executeRedo = useCallback(async () => {
    if (isProcessingRef.current) return;

    const entry = history.getRedoEntry();
    if (!entry) {
      console.log('[CanvasHistory] Nothing to redo');
      return;
    }

    isProcessingRef.current = true;
    history.setIsSkipping(true); // Redo 중 발생하는 동작 기록 방지

    console.log('[Redo] Executing operations:', entry.operations);

    try {
      const sortedOperations = [...entry.operations].sort((a, b) => {
        // Redo 시 (다시 실행): EDGE_DELETE는 BLOCK_DELETE보다 먼저 (의존성 제거)
        if (a.type === 'EDGE_DELETE' && b.type === 'BLOCK_DELETE') return -1;
        if (a.type === 'BLOCK_DELETE' && b.type === 'EDGE_DELETE') return 1;
        
        // Redo 시 (다시 실행): BLOCK_ADD는 EDGE_ADD보다 먼저 (의존성 생성)
        if (a.type === 'BLOCK_ADD' && b.type === 'EDGE_ADD') return -1;
        if (a.type === 'EDGE_ADD' && b.type === 'BLOCK_ADD') return 1;

        return 0;
      });

      for (const operation of sortedOperations) {
        switch (operation.type) {
          case 'BLOCK_ADD':
            // [DEBUG] Redo 데이터 확인
            console.log('[Redo] Restoring block node:', {
              id: operation.blockMountId,
              type: operation.data.node?.type,
              position: operation.data.node?.position,
              data: !!operation.data.node?.data
            });

            // Redo: 블록 다시 추가 (setNodes로 상태 업데이트)
            if (operation.data.node) {
              setNodes(nodes => {
                const filtered = nodes.filter(n => n.id !== operation.blockMountId);
                return [...filtered, operation.data.node];
              });
              // React Flow 인스턴스에도 한 번 더 명시적으로 알림
              reactFlowInstance.addNodes([operation.data.node]);
            }
            
            await blockLifecycle.restoreBlockMounts(operation.blockMountId);
            break;
          case 'BLOCK_DELETE':
            // Redo: 블록 다시 제거
            setNodes(nodes => nodes.filter(n => n.id !== operation.blockMountId));
            await blockLifecycle.softDeleteBlockMounts(operation.blockMountId);
            break;
          case 'BLOCK_MOVE':
            setNodes(nodes => 
              nodes.map(n => n.id === operation.blockMountId ? { ...n, position: operation.data.newPosition } : n)
            );
            await blockTransform.updateBlockPosition({
              blockPositions: [{ blockMountId: operation.blockMountId, position: operation.data.newPosition }]
            });
            break;
          case 'BLOCK_RESIZE':
            setNodes(nodes => 
              nodes.map(n => n.id === operation.blockMountId ? { 
                ...n, 
                width: operation.data.newSize.width, 
                height: operation.data.newSize.height 
              } : n)
            );
            await blockTransform.updateBlockSize({
              blockMountId: operation.blockMountId,
              newSize: operation.data.newSize
            });
            break;
          case 'BLOCK_CONTENT_UPDATE':
            // Redo: 이전 Undo로 업데이트된 콘텐츠를 다시 새 버전으로
            setNodes(nodes => 
              nodes.map(n => {
                if (n.id === operation.blockMountId) {
                  const nodeData = n.data as any;
                  return { ...n, data: { ...nodeData, content: operation.data.newContent } };
                }
                return n;
              })
            );
            break;
          case 'EDGE_ADD':
            // Redo: 이전 Undo로 삭제되었던 Edge를 다시 복구 (ID 보존)
            if (operation.data.edge) {
              setEdges(prev => [...prev, operation.data.edge]);
            }
            await edgeLifecycle.restoreEdges(operation.edgeId);
            break;
          case 'EDGE_DELETE':
            // Redo: Edge를 다시 삭제
            setEdges(edges => edges.filter(e => e.id !== operation.edgeId));
            await edgeLifecycle.deleteEdge({ edgeId: operation.edgeId });
            break;
          case 'EDGE_RECONNECT':
            // Redo: "이전 연결"을 "새 연결"로 Update (ID 유지)
            setEdges(edges => 
              edges.map(e => e.id === operation.edgeId ? { 
                ...e, 
                source: operation.data.newSource, 
                target: operation.data.newTarget,
                sourceHandle: operation.data.newSourceHandle || undefined,
                targetHandle: operation.data.newTargetHandle || undefined,
              } : e)
            );

            // 서버 업데이트 (단순 Update 호출)
            await edgeLifecycle.reconnectEdge({
              edgeId: operation.edgeId,
              newSourceBlockMountId: operation.data.newSource,
              newTargetBlockMountId: operation.data.newTarget,
              sourceHandle: operation.data.newSourceHandle,
              targetHandle: operation.data.newTargetHandle,
              skipOptimisticUpdate: true,
            });
            break;
        }
      }
      history.commitRedo();
    } catch (error) {
      console.error('[Redo] Error during execution:', error);
    } finally {
      setTimeout(() => {
        history.setIsSkipping(false);
        isProcessingRef.current = false;
        console.log('[Redo] Reset skipping and processing state');
      }, 300);
    }
  }, [history, reactFlowInstance, setNodes, setEdges, blockLifecycle, blockTransform, edgeLifecycle]);

  // =========================================================================
  // 5. Interaction Settings
  // =========================================================================
  // PanOnScroll 동적 제어: textarea 편집 중에는 비활성화
  const panOnScrollEnabled = !canvasMode.isTextareaEditing;
  // PanOnDrag 동적 제어: 패닝 모드에서는 드래그로 패닝 가능, readonly일 때는 항상 패닝 가능
  const panOnDragEnabled = readonly || canvasMode.isPanningMode();
  // 🎨 블록 생성 모드 확인 (readonly일 때는 항상 false)
  const isBlockCreationMode = !readonly && canvasMode.isBlockCreationMode();

  // =========================================================================
  // 6. Node/Edge Types
  // =========================================================================
  // 노드 타입 정의 - 공통 config 사용 + PDF 추가
  const nodeTypes = useMemo(
    () => ({
      ...CANVAS_NODE_TYPES,
    }),
    []
  );

  // 엣지 타입 정의
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      // 다른 엣지 타입들도 여기에 추가 가능
    }),
    []
  );

  // =========================================================================
  // 7. Bundle Dependencies for UI/Business Hooks
  // =========================================================================
  const uiDependencies = useMemo(
    () => ({
      canvasMode,
      reactFlow: {
        getNodes: reactFlowInstance.getNodes,
        getEdges: reactFlowInstance.getEdges,
        setNodes: reactFlowInstance.setNodes,
        getViewport: reactFlowInstance.getViewport,
        setViewport: reactFlowInstance.setViewport,
        screenToFlowPosition: reactFlowInstance.screenToFlowPosition,
      },
      snapGuides,
    }),
    [
      canvasMode,
      history,
      reactFlowInstance.getNodes,
      reactFlowInstance.setNodes,
      reactFlowInstance.getViewport,
      reactFlowInstance.setViewport,
      reactFlowInstance.screenToFlowPosition,
      snapGuides,
    ]
  );

  const businessDependencies = useMemo(
    () => ({
      pageId,
      canvasSelection,
      history, // Pass history here
      edgeLifecycle,
      blockLifecycle,
      reactFlow: {
        getNodes: reactFlowInstance.getNodes,
        getEdges: reactFlowInstance.getEdges,
        setNodes: setNodes,
        setEdges: setEdges,
        getViewport: reactFlowInstance.getViewport,
        setViewport: reactFlowInstance.setViewport,
        screenToFlowPosition: reactFlowInstance.screenToFlowPosition,
      },
      updateBlockSize: blockTransform.updateBlockSize,
    }),
    [
      pageId,
      canvasSelection,
      history,
      edgeLifecycle,
      blockLifecycle,
      reactFlowInstance.getNodes,
      reactFlowInstance.getEdges,
      setNodes,
      setEdges,
      reactFlowInstance.getViewport,
      reactFlowInstance.setViewport,
      reactFlowInstance.screenToFlowPosition,
      blockTransform.updateBlockSize,
    ]
  );

  // =========================================================================
  // 8. Inject into UI State Hook and Business Logic Hook
  // =========================================================================
  const uiState = useReactFlowWrapperUI(uiDependencies);
  const businessLogic = useReactFlowWrapperBusiness(businessDependencies);

  // =========================================================================
  // 9. Viewport Management
  // =========================================================================
  // Viewport 생명주기는 use-canvas-viewport.ts에서 완전히 관리
  const { defaultViewport, handleViewportChange, flushViewportSave } =
    canvasViewport;

  const onMove = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      handleViewportChange(viewport);
    },
    [handleViewportChange]
  );

  // =========================================================================
  // 10. Custom Handlers (Block Creation Mode Override)
  // =========================================================================
  // 블럭 타입 선택 핸들러 (다이얼로그 닫기 + 블록 생성 모드 진입)
  const handleSelectBlockType = useCallback(
    (blockType: BlockType) => {
      // UI 상태: 다이얼로그 닫기
      uiState.setShowAddDialog(false);
      // 비즈니스 로직: 블록 생성 모드 진입
      canvasMode.enterBlockCreationMode(blockType);
    },
    [uiState, canvasMode]
  );

  // ✅ 블록 생성 모드용 onPaneClick override
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      // readonly일 때는 블록 생성 모드가 아니므로 일반 모드 처리
      if (readonly) {
        uiState.onPaneClick(event);
        return;
      }

      if (isBlockCreationMode) {
        const currentMode = canvasMode.getCurrentMode();
        if (currentMode.type !== 'block-creation' || !currentMode.blockType) {
          return;
        }

        const blockType = currentMode.blockType;
        const blockSize =
          BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

        const mouseFlowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const adjustedPosition = {
          x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
          y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
        };

        blockLifecycle.createAndMountBlock(blockType, adjustedPosition);
        canvasMode.exitToDefaultMode();
        return;
      }

      // 일반 모드는 기존 콜백 사용
      uiState.onPaneClick(event);
    },
    [
      readonly,
      isBlockCreationMode,
      canvasMode,
      blockLifecycle.createAndMountBlock,
      reactFlowInstance,
      uiState,
    ]
  );

  // ✅ 블록 생성 모드용 onNodeClick override
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // readonly일 때는 블록 생성 모드가 아니므로 일반 모드 처리
      if (readonly) {
        uiState.onNodeClick(event, node);
        return;
      }

      if (isBlockCreationMode) {
        const currentMode = canvasMode.getCurrentMode();
        if (currentMode.type !== 'block-creation' || !currentMode.blockType) {
          return;
        }

        const blockType = currentMode.blockType;
        const blockSize =
          BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];

        const mouseFlowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const adjustedPosition = {
          x: mouseFlowPosition.x - (blockSize?.width ?? 200) / 2,
          y: mouseFlowPosition.y - (blockSize?.height ?? 150) / 2,
        };

        blockLifecycle.createAndMountBlock(blockType, adjustedPosition);
        canvasMode.exitToDefaultMode();
        return;
      }

      // 일반 모드는 기존 콜백 사용 (UI State에서)
      uiState.onNodeClick(event, node);
    },
    [
      readonly,
      isBlockCreationMode,
      canvasMode,
      blockLifecycle.createAndMountBlock,
      reactFlowInstance,
      uiState,
    ]
  );

  // =========================================================================
  // 11. Global Keyboard Event Listener (React Flow Focus Workaround)
  // =========================================================================
  // executeUndo/executeRedo에 대한 최신 참조 유지 (Stale Closure 방지)
  const executeUndoRef = useRef(executeUndo);
  const executeRedoRef = useRef(executeRedo);
  
  useEffect(() => {
    executeUndoRef.current = executeUndo;
    executeRedoRef.current = executeRedo;
  }, [executeUndo, executeRedo]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      // ... existing input check ...
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 플랫폼 감지
      let isMac = false;
      if (typeof navigator !== 'undefined') {
        if ('userAgentData' in navigator) {
          const uaData = navigator.userAgentData as { platform?: string };
          isMac = uaData.platform?.toLowerCase().includes('mac') ?? false;
        } else {
          const userAgent = navigator.userAgent.toLowerCase();
          isMac = userAgent.includes('mac');
        }
      }
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (readonly) return;

      // Cmd+Z: Undo
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        console.log('[Shortcut] Cmd+Z detected');
        event.preventDefault();
        executeUndoRef.current();
      }

      // Cmd+Shift+Z: Redo
      if (isCtrlOrCmd && event.key === 'z' && event.shiftKey) {
        console.log('[Shortcut] Cmd+Shift+Z detected');
        event.preventDefault();
        executeRedoRef.current();
      }

      // ... other shortcuts ...
      if (isCtrlOrCmd && event.key === 'v') {
        event.preventDefault();
        businessLogic.handlePaste();
      }

      if (isCtrlOrCmd && event.key === 'd') {
        event.preventDefault();
        businessLogic.handleDuplicate();
      }
    };
    
    // KeyUp handler
    const handleGlobalKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.code === 'Space') {
        flushViewportSave();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [readonly, businessLogic, flushViewportSave]);

  // =========================================================================
  // 12. Wrap UI Handlers with Business Logic
  // =========================================================================

  // 드래그/리사이즈 시작 시 상태 저장용 Ref
  const dragStartPositionsRef = useRef<Record<string, Position>>({});

  // onNodeDragStart: 드래그 시작 시 위치 백업
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      if (readonly) return;

      const positions: Record<string, Position> = {};
      draggedNodes.forEach((n) => {
        positions[n.id] = { ...n.position };
      });
      dragStartPositionsRef.current = positions;

      uiState.onNodeDragStart(event, node, draggedNodes);
    },
    [readonly, uiState]
  );

  // onNodeDrag: 스냅 가이드라인 + 그룹 collision 시각 피드백
  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
      if (readonly) return;

      // 1. 기존 UI 로직 실행 (스냅 가이드라인 표시)
      uiState.onNodeDrag(event, node, draggedNodes);

      // 2. 그룹 collision 시각 피드백
      const allNodes = reactFlowInstance.getNodes();
      const groupNodes = allNodes.filter(n => n.type === 'group' && !draggedNodes.some(d => d.id === n.id));

      // 드래그 중인 노드가 그룹인 경우는 collision 표시 안 함
      const isDraggingGroup = draggedNodes.some(n => n.type === 'group');
      if (isDraggingGroup) {
        // 모든 그룹의 collision 상태 제거
        reactFlowInstance.setNodes(prev =>
          prev.map(n =>
            n.type === 'group' && (n.data as any)?.isCollisionTarget
              ? { ...n, data: { ...n.data, isCollisionTarget: false } }
              : n
          )
        );
        return;
      }

      // 중심점 계산 (useGroupCollision의 유틸리티 함수 사용)
      const checkPoint = groupCollision.calculateCentroid(draggedNodes);

      // 충돌하는 그룹 찾기 (useGroupCollision의 유틸리티 함수 사용)
      let collidingGroupId: string | null = null;
      for (const g of groupNodes) {
        if (groupCollision.isPointInsideGroup(checkPoint, g)) {
          collidingGroupId = g.id;
          break;
        }
      }

      // 그룹 노드들의 isCollisionTarget 상태 업데이트
      reactFlowInstance.setNodes(prev =>
        prev.map(n => {
          if (n.type !== 'group') return n;
          const shouldHighlight = n.id === collidingGroupId;
          const currentHighlight = (n.data as any)?.isCollisionTarget === true;
          if (shouldHighlight !== currentHighlight) {
            return { ...n, data: { ...n.data, isCollisionTarget: shouldHighlight } };
          }
          return n;
        })
      );
    },
    [readonly, uiState, reactFlowInstance, groupCollision]
  );

  // onNodeDragStop: UI 로직(스냅, 가이드라인) + Collision 감지 + 서버 저장
  const onNodeDragStop = useCallback(
    async (
      event: React.MouseEvent,
      node: Node,
      draggedNodes: Node[]
    ): Promise<void> => {
      // readonly일 때는 드래그 중지 처리하지 않음
      if (readonly) {
        return;
      }

      // 1. UI 로직 먼저 실행 (스냅 적용, 가이드라인 숨김, 모드 변경)
      uiState.handleNodeDragStopUI(event, node, draggedNodes);

      // 2. 모든 그룹의 collision 하이라이트 제거
      reactFlowInstance.setNodes(prev =>
        prev.map(n =>
          n.type === 'group' && (n.data as any)?.isCollisionTarget
            ? { ...n, data: { ...n.data, isCollisionTarget: false } }
            : n
        )
      );

      // 3. Collision Detection (다중 선택의 중심점 기준으로 처리)
      const collisionHandled = await groupCollision.handleNodeDragStop(draggedNodes);

      // 4. 서버 저장 (collision이 처리되지 않은 경우만)
      if (!collisionHandled) {
        const blockPositions = draggedNodes
          .map(draggedNode => ({
            blockMountId: draggedNode.id,
            position: draggedNode.position,
            previousPosition: dragStartPositionsRef.current[draggedNode.id],
          }))
          .filter(
            bp =>
              !String(bp.blockMountId).startsWith('optimistic-') &&
              !String(bp.blockMountId).startsWith('group-optimistic-')
          );
        
        if (blockPositions.length > 0) {
          // 다중 이동인 경우 배치로 기록
          if (blockPositions.length > 1) {
            history.startBatch();
          }
          
          await blockTransform.updateBlockPosition({ blockPositions });
          
          if (blockPositions.length > 1) {
            history.endBatch('Move Blocks');
          }
        }
      }

      // 5. 백업 초기화
      dragStartPositionsRef.current = {};
    },
    [readonly, uiState, blockTransform, groupCollision, reactFlowInstance]
  );

  // readonly일 때 편집 관련 핸들러를 no-op으로 처리
  const readonlyOnNodesDelete = useCallback(
    async (_deletedNodes: Node[]) => {
      // readonly일 때는 삭제하지 않음
    },
    []
  );

  const readonlyOnEdgesDelete = useCallback(
    async (_deletedEdges: Edge[]) => {
      // readonly일 때는 삭제하지 않음
    },
    []
  );

  const readonlyOnConnect = useCallback(() => {
    // readonly일 때는 연결하지 않음
  }, []);

  const readonlyOnReconnect = useCallback(() => {
    // readonly일 때는 재연결하지 않음
    return Promise.resolve(false);
  }, []);

  const readonlyOnReconnectStart = useCallback(() => {
    // readonly일 때는 재연결 시작하지 않음
  }, []);

  const readonlyOnReconnectEnd = useCallback(async () => {
    // readonly일 때는 재연결 종료하지 않음
  }, []);

  // =========================================================================
  // 13. Feature Flags (readonly에 따라 자동 처리)
  // =========================================================================
  // readonly일 때 편집 전용 기능 비활성화
  const showAIAgent = false; // !readonly;
  const showBlockCreation = !readonly;

  // =========================================================================
  // 14. 노드 표시용 (부모가 선택된 자식은 z-index 상승용 className 추가)
  // =========================================================================
  const nodesDisplay = useMemo(() => {
    return nodes.map(n => {
      if (!n.parentId) return n;
      const parent = nodes.find(p => p.id === n.parentId);
      if (!parent?.selected) return n;
      const existingClass = (n as Node & { className?: string }).className ?? '';
      const added = 'react-flow__node--parent-selected';
      const newClass = existingClass ? `${existingClass} ${added}` : added;
      return { ...n, className: newClass };
    });
  }, [nodes]);

  // =========================================================================
  // 15. Compose and Return
  // =========================================================================

  return {
    // =========================================================================
    // State
    // =========================================================================
    // React Flow State (표시용 nodes: 부모 선택 시 자식도 상단 레이어)
    nodes: nodesDisplay,
    edges,
    nodeTypes,
    edgeTypes,

    // Theme
    colorMode,

    // Interaction settings
    panOnScrollEnabled,
    panOnDragEnabled,
    isBlockCreationMode,
    isPanningMode: canvasMode.isPanningMode(), // Used for key prop to force re-render

    // Viewport
    defaultViewport,

    // UI State
    showAddDialog: uiState.showAddDialog,
    guidelines: snapGuides.guidelines,

    // =========================================================================
    // Callbacks
    // =========================================================================
    // React Flow callbacks
    onNodesChange,
    onEdgesChange,
    onMove,

    // Drag callbacks
    onNodeDragStart, // 래핑된 버전 사용 (위치 백업용)
    onNodeDrag, // collision 시각 피드백 포함
    onNodeDragStop, // 래핑된 버전 사용

    // Selection callbacks
    onNodeClick: uiState.onNodeClick,
    onSelectionChange: uiState.onSelectionChange,
    onPaneClick: uiState.onPaneClick,
    onWheel: uiState.onWheel,
    onWheelCapture: uiState.onWheelCapture,

    // Business Logic callbacks (readonly일 때는 no-op)
    onConnectStart: readonly ? () => { } : businessLogic.onConnectStart,
    onConnect: readonly ? readonlyOnConnect : businessLogic.onConnect,
    onReconnect: readonly
      ? readonlyOnReconnect
      : businessLogic.onReconnect,
    onReconnectStart: readonly
      ? readonlyOnReconnectStart
      : businessLogic.onReconnectStart,
    onReconnectEnd: readonly
      ? readonlyOnReconnectEnd
      : businessLogic.onReconnectEnd,
    onNodesDelete: readonly
      ? readonlyOnNodesDelete
      : businessLogic.onNodesDelete,
    onEdgesDelete: readonly
      ? readonlyOnEdgesDelete
      : businessLogic.onEdgesDelete,

    // =========================================================================
    // Custom Handlers
    // =========================================================================
    handlePaneClick,
    handleNodeClick,
    handleSelectBlockType,
    handleWheel: uiState.onWheel,
    handleWheelCapture: uiState.onWheelCapture,
    setShowAddDialog: uiState.setShowAddDialog,
    handlePaste: businessLogic.handlePaste,
    handleDuplicate: businessLogic.handleDuplicate,
    handleNodeResize: businessLogic.handleNodeResize,

    // Feature flags
    showAIAgent,
    showBlockCreation,

    // History
    history,
    executeUndo,
    executeRedo,
  };
}
