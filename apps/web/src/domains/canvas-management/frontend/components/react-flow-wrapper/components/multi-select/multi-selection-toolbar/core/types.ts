import type { Node, Viewport } from '@xyflow/react';

import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { AlignmentType } from '@/domains/canvas-management/shared/types/common.types';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

/**
 * Block alignment type
 * - Horizontal alignment: 'left' | 'center' | 'right'
 * - Vertical alignment: 'top' | 'middle' | 'bottom'
 *
 * @type AlignmentType
 */
export { type AlignmentType };

/**
 * Block duplication information
 */
export interface BlockDuplicateInfo {
  blockMountId: string;
  offsetX: number;
  offsetY: number;
}

/**
 * Block duplication parameters
 */
export interface DuplicateBlocksParams {
  blockMountIds: BlockDuplicateInfo[];
}

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

export interface ToolbarPosition {
  left: number;
  top: number;
}

export interface NodeWithSize {
  id: string;
  position: { x: number; y: number };
  actualWidth: number;
  actualHeight: number;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * React Flow dependency interface
 * Used to reduce coupling with external library (XYFlow)
 */
export interface FlowDependencies {
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  deleteElements: (params: {
    nodes?: { id: string }[];
    edges?: { id: string }[];
  }) => void;
}

/**
 * Domain logic dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface DomainDependencies {
  alignBlocks: (blockIds: string[], alignmentType: AlignmentType) => void;
  distributeBlocks: (
    blockIds: string[],
    direction: 'horizontal' | 'vertical'
  ) => void;
  duplicateMultipleBlocksAndMount: (
    blockMountIds: BlockDuplicateInfo[]
  ) => Promise<void>;
  createGroupFromNodes: (params: {
    nodeIds: string[];
    groupTitle?: string;
    groupColor?: string;
  }) => Promise<{ groupBlockMountId: string; groupBlockId: string }>;
  exitToDefaultMode: () => void;
}

/**
 * Dependency data for UI state calculation
 */
export interface UIStateDependencies {
  selectedNodes: Node[];
  viewport: Viewport;
  getNodes: () => Node[];
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

/**
 * Multi-Selection Toolbar business logic interface
 *
 * This interface defines all business operations performed by the toolbar.
 * In production environments, it performs actual API calls,
 * while in test/storybook environments, mock implementations can be injected.
 *
 * @interface MultiSelectionToolbarBusinessLogic
 *
 * @example
 * ```tsx
 * // Production implementation
 * const business = useMultiSelectionToolbarBusiness(flowDeps, domainDeps);
 *
 * // Mock implementation
 * const mockBusiness = useMockMultiSelectionToolbarBusiness();
 * ```
 */
export interface MultiSelectionToolbarBusinessLogic {
  /**
   * Aligns selected blocks in the specified manner.
   *
   * @param blockIds - Array of block IDs to align
   * @param alignmentType - Alignment type ('left' | 'center' | 'right' | 'top' | 'middle' | 'bottom')
   * @example
   * ```tsx
   * business.alignBlocks(['block-1', 'block-2'], 'left');
   * ```
   */
  alignBlocks: (blockIds: string[], alignmentType: AlignmentType) => void;

  /**
   * Distributes selected blocks evenly.
   *
   * @param blockIds - Array of block IDs to distribute
   * @param direction - Distribution direction ('horizontal' | 'vertical')
   * @example
   * ```tsx
   * business.distributeBlocks(['block-1', 'block-2', 'block-3'], 'horizontal');
   * ```
   */
  distributeBlocks: (
    blockIds: string[],
    direction: 'horizontal' | 'vertical'
  ) => void;

  /**
   * Duplicates selected blocks.
   * Each block is duplicated at the specified offset position.
   *
   * @param params - Information and offsets of blocks to duplicate
   * @returns Promise<void> - Resolves when duplication is complete
   * @example
   * ```tsx
   * await business.duplicateBlocks({
   *   blockMountIds: [
   *     { blockMountId: 'mount-1', offsetX: 250, offsetY: 20 }
   *   ]
   * });
   * ```
   */
  duplicateBlocks: (params: DuplicateBlocksParams) => Promise<void>;

  /**
   * Duplicates selected blocks with automatic offset calculation.
   * Calculates offsets based on block dimensions and selection order.
   *
   * @param selectedBlockIds - Array of selected block IDs
   * @param selectedNodes - Array of selected node objects containing block data
   * @returns Promise<void> - Resolves when duplication is complete
   * @example
   * ```tsx
   * await business.duplicateSelectedBlocks(['block-1', 'block-2'], selectedNodes);
   * ```
   */
  duplicateSelectedBlocks: (
    selectedBlockIds: string[],
    selectedNodes: Node[]
  ) => Promise<void>;

  /**
   * Deletes selected blocks.
   * Performs optimistic UI updates, while server synchronization is handled in a separate callback.
   *
   * @param blockIds - Array of block IDs to delete
   * @example
   * ```tsx
   * business.deleteBlocks(['block-1', 'block-2']);
   * ```
   */
  deleteBlocks: (blockIds: string[]) => void;

  /**
   * Creates a group from selected blocks.
   * Automatically ungroupsany existing groups and creates a new group containing all selected blocks.
   *
   * @param selectedBlockIds - Array of selected block IDs
   * @returns Promise<void> - Resolves when group creation is complete
   * @example
   * ```tsx
   * await business.createGroupFromSelectedBlocks(['block-1', 'block-2']);
   * ```
   */
  createGroupFromSelectedBlocks: (
    selectedBlockIds: string[]
  ) => Promise<{ groupBlockMountId: string; groupBlockId: string } | undefined>;

  /**
   * Exits selection mode and returns to default mode.
   * Deselects all nodes and changes the canvas mode.
   *
   * @example
   * ```tsx
   * business.exitSelection();
   * ```
   */
  exitSelection: () => void;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * Multi-Selection Toolbar Hook return type
 *
 * This interface defines all values returned by the `useMultiSelectionToolbar` hook.
 * It includes UI state, handler functions, and selection state information.
 *
 * @interface UseMultiSelectionToolbarReturn
 */
export interface UseMultiSelectionToolbarReturn {
  /**
   * Toolbar's on-screen position coordinates (left, top)
   * Calculated to be positioned at the center-top of selected blocks
   * Returns `null` if no blocks are selected
   */
  toolbarPosition: ToolbarPosition | null;

  /**
   * Reference to the toolbar DOM element
   * Used for positioning calculations or external click detection
   */
  toolbarRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Handler to align selected blocks
   * @param alignmentType - Alignment type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
   * @example
   * ```tsx
   * const { handleAlign } = useMultiSelectionToolbar(props);
   * handleAlign('left'); // Align selected blocks to the left
   * ```
   */
  handleAlign: (alignmentType: AlignmentType) => void;

  /**
   * Handler to evenly distribute selected blocks
   * @param direction - Distribution direction: 'horizontal' | 'vertical'
   * @example
   * ```tsx
   * const { handleDistribute } = useMultiSelectionToolbar(props);
   * handleDistribute('horizontal'); // Evenly distribute selected blocks horizontally
   * ```
   */
  handleDistribute: (direction: 'horizontal' | 'vertical') => void;

  /**
   * Handler to duplicate selected blocks
   * Each block is duplicated with an offset to the right from its original position
   * @returns Promise<void> - Resolves when duplication is complete
   * @example
   * ```tsx
   * const { handleDuplicate } = useMultiSelectionToolbar(props);
   * await handleDuplicate(); // Duplicate all selected blocks
   * ```
   */
  handleDuplicate: () => Promise<void>;

  /**
   * Handler to delete selected blocks
   * Performs optimistic UI update followed by server synchronization
   * @example
   * ```tsx
   * const { handleDelete } = useMultiSelectionToolbar(props);
   * handleDelete(); // Delete all selected blocks
   * ```
   */
  handleDelete: () => Promise<void>;

  /**
   * Handler to create a group from selected blocks
   * Automatically ungroups existing groups and creates a new group
   * @returns Promise<void> - Resolves when group creation is complete
   * @example
   * ```tsx
   * const { handleCreateGroup } = useMultiSelectionToolbar(props);
   * await handleCreateGroup(); // Create group from selected blocks
   * ```
   */
  handleCreateGroup: () => Promise<void>;

  /**
   * Handler to exit selection mode and return to default mode
   * Called on ESC key press or toolbar external click
   * @example
   * ```tsx
   * const { handleEscape } = useMultiSelectionToolbar(props);
   * handleEscape(); // Deselect and exit mode
   * ```
   */
  handleEscape: () => void;

  /**
   * Array of currently selected block IDs
   * @example
   * ```tsx
   * const { selectedBlockIds } = useMultiSelectionToolbar(props);
   * console.log(selectedBlockIds); // ['block-1', 'block-2', ...]
   * ```
   */
  selectedBlockIds: string[];

  /**
   * Number of currently selected blocks
   * @example
   * ```tsx
   * const { selectionCount } = useMultiSelectionToolbar(props);
   * if (selectionCount > 0) {
   *   console.log(`${selectionCount} blocks selected`);
   * }
   * ```
   */
  selectionCount: number;

  /**
   * Whether multi-selection mode is currently active
   * @example
   * ```tsx
   * const { isMultiSelectionMode } = useMultiSelectionToolbar(props);
   * if (isMultiSelectionMode) {
   *   // Display multi-selection mode UI
   * }
   * ```
   */
  isMultiSelectionMode: boolean;

  /**
   * Whether the toolbar should be visible
   * Returns `true` when multi-selection mode is active, at least 2 blocks are selected, and toolbar position is calculated
   * @example
   * ```tsx
   * const { isVisible } = useMultiSelectionToolbar(props);
   * if (!isVisible) return null;
   * ```
   */
  isVisible: boolean;

  /**
   * Whether the canvas is in readonly mode
   * When true, editing actions (duplicate, delete) should be disabled
   * @example
   * ```tsx
   * const { readonly } = useMultiSelectionToolbar(props);
   * <Button disabled={readonly} onClick={handleDelete}>Delete</Button>
   * ```
   */
  readonly: boolean;
}
