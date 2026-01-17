// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================
import type { Edge, Node } from '@xyflow/react';

import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { CreateEdgeInput } from '@/domains/canvas-management/frontend/hooks/edge/use-create-edge';
import type { DeleteEdgeInput } from '@/domains/canvas-management/frontend/hooks/edge/use-delete-edge';
import type { ReconnectEdgeInput } from '@/domains/canvas-management/frontend/hooks/edge/use-reconnect-edge';
import type { EdgeView } from '@/domains/canvas-management/shared/dtos';

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

export interface BlockNodeData {
  blockId: string;
  blockType: string;
  // ... other properties
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * Canvas Mode dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface CanvasModeDependencies {
  enterDraggingMode: (draggedIds: string[]) => void;
  enterSingleSelectionMode: (nodeId: string) => void;
  enterMultiSelectionMode: (nodeIds: string[]) => void;
  enterBlockCreationMode: (blockType: BlockType) => void;
  enterBlockEditingMode: (blockId: string, blockMountId: string) => void;
  exitToDefaultMode: () => void;
  isBlockCreationMode: () => boolean;
  isMultiSelectionMode: () => boolean;
  isSingleSelectionMode: () => boolean;
  isDraggingMode: () => boolean;
  isTextareaEditing: boolean;
  isPanningMode: () => boolean;
  getCurrentMode: () => any;
}

/**
 * Canvas Selection dependency interface
 */
export interface CanvasSelectionDependencies {
  getSelectedBlocks: () => string[];
}

/**
 * Block Transform dependency interface
 */
export interface BlockTransformDependencies {
  updateBlockPosition: (input: {
    blockPositions: Array<{
      blockMountId: string;
      position: { x: number; y: number };
    }>;
  }) => Promise<any>;
  updateBlockSize: (input: {
    blockMountId: string;
    newSize: { width: number; height: number };
  }) => Promise<any>;
}

/**
 * Snap Guides dependency interface
 */
export interface SnapGuidesDependencies {
  calculateSnapGuides: (
    nodeId: string,
    position: { x: number; y: number },
    currentNodes: Node[]
  ) => { position: { x: number; y: number } };
  hideGuidelines: () => void;
  guidelines: any[];
}

/**
 * Edge Management dependency interface
 */
export interface EdgeLifecycleDependencies {
  createEdge: (input: CreateEdgeInput) => Promise<EdgeView | null>;
  reconnectEdge: (input: ReconnectEdgeInput) => Promise<boolean>;
  deleteEdge: (input: DeleteEdgeInput) => Promise<boolean>;
}

/**
 * Block Lifecycle dependency interface
 */
export interface BlockLifecycleDependencies {
  duplicateBlockAndMount: (
    blockMountId: string,
    offsetX?: number,
    offsetY?: number
  ) => Promise<void>;
  createAndMountBlock: (
    blockType: BlockType,
    position: { x: number; y: number },
    initialProperties?: any,
    initialContent?: any
  ) => Promise<void | any>;
  softDeleteBlockMounts: (
    blockMountIds: string[],
    pageId?: string
  ) => Promise<void>;
}

/**
 * React Flow dependencies
 */
export interface ReactFlowDependencies {
  getNodes: () => Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  getViewport: () => { x: number; y: number; zoom: number };
  setViewport: (
    viewport: { x: number; y: number; zoom: number },
    options?: { duration?: number }
  ) => void;
  screenToFlowPosition: (position: { x: number; y: number }) => {
    x: number;
    y: number;
  };
}

/**
 * Canvas Viewport dependencies
 */
export interface CanvasViewportDependencies {
  fitToScreen: () => void;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

/**
 * Callbacks Business Logic Interface
 * Used for dependency injection in business hook
 */
export interface CallbacksBusinessLogic {
  onConnect: (connection: any) => Promise<void>;
  onReconnect: (oldEdge: Edge, newConnection: any) => Promise<boolean>;
  onReconnectEnd: (event: MouseEvent | TouchEvent, edge: Edge) => Promise<void>;
  onNodesDelete: (deletedNodes: Node[]) => Promise<void>;
  onKeyDown: (event: KeyboardEvent) => void;
  handleNodeResize: (
    nodeId: string,
    newWidth: number,
    newHeight: number
  ) => Promise<void>;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * React Flow Wrapper Props
 */
export interface ReactFlowWrapperProps {
  pageId: string;
  orgId: string;
  workspaceId: string;
  initialNodes: any[];
  initialEdges: Edge[];
}

/**
 * React Flow Wrapper Hook Dependencies
 * All external dependencies injected into the hook
 */
export interface ReactFlowWrapperDependencies {
  pageId: string;
  canvasMode: CanvasModeDependencies;
  canvasSelection: CanvasSelectionDependencies;
  blockTransform: BlockTransformDependencies;
  snapGuides: SnapGuidesDependencies;
  edgeLifecycle: EdgeLifecycleDependencies;
  blockLifecycle: BlockLifecycleDependencies;
  reactFlow: ReactFlowDependencies;
  canvasViewport: CanvasViewportDependencies;
}
