import type { Node, Viewport } from '@xyflow/react';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

/**
 * Bounding box position in screen coordinates
 */
export interface BoundingBoxBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Node with measured dimensions
 */
export interface NodeWithSize {
  id: string;
  position: { x: number; y: number };
  actualWidth: number;
  actualHeight: number;
}

/**
 * Initial position of a node when drag starts
 */
export interface InitialNodePosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Block position for server persistence
 */
export interface BlockPosition {
  blockId: string;
  position: { x: number; y: number };
}

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

// (No additional domain models needed beyond the atomic types above)

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * React Flow dependency interface
 * Used to reduce coupling with external library (XYFlow)
 */
export interface FlowDependencies {
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
}

/**
 * Domain logic dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface DomainDependencies {
  saveBlockPositions: (
    blockPositions: BlockPosition[] | BlockPosition
  ) => Promise<unknown>;
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
 * Selection Bounding Box UI logic interface
 *
 * This interface defines all UI operations performed by the bounding box.
 * In production environments, it performs actual calculations and state management,
 * while in test/storybook environments, mock implementations can be injected.
 *
 * @interface SelectionBoundingBoxUILogic
 */
export interface SelectionBoundingBoxUILogic {
  /**
   * Bounding box bounds in screen coordinates
   * Returns `null` if no blocks are selected or bounds cannot be calculated
   */
  bounds: BoundingBoxBounds | null;

  /**
   * Reference to the bounding box DOM element
   * Used for positioning calculations or external click detection
   */
  boundingBoxRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Calculates which node positions have changed by comparing initial and current positions
   *
   * @param initialPositions - Array of initial node positions
   * @returns Array of changed block positions
   * @example
   * ```tsx
   * const changed = uiLogic.calculateChangedPositions([
   *   { id: 'node-1', x: 100, y: 200 }
   * ]);
   * ```
   */
  calculateChangedPositions: (
    initialPositions: InitialNodePosition[]
  ) => BlockPosition[];

  /**
   * Starts dragging: stores initial positions and drag start point
   *
   * @param e - Pointer event
   * @returns Array of initial node positions
   * @example
   * ```tsx
   * const initialPositions = uiLogic.startDragging(e);
   * ```
   */
  startDragging: (e: React.PointerEvent) => InitialNodePosition[];

  /**
   * Moves dragging: calculates updated positions based on mouse movement
   *
   * @param e - Pointer event
   * @param initialPositions - Array of initial node positions
   * @returns Array of updated node positions, or null if not dragging
   * @example
   * ```tsx
   * const updatedPositions = uiLogic.moveDragging(e, initialPositions);
   * ```
   */
  moveDragging: (
    e: PointerEvent,
    initialPositions: InitialNodePosition[]
  ) => Array<{ id: string; x: number; y: number }> | null;

  /**
   * Ends dragging: resets state and calculates changed positions
   *
   * @param e - Pointer event
   * @param initialPositions - Array of initial node positions
   * @returns Array of changed block positions, or null if not dragging
   * @example
   * ```tsx
   * const changedPositions = uiLogic.endDragging(e, initialPositions);
   * ```
   */
  endDragging: (
    e: PointerEvent,
    initialPositions: InitialNodePosition[]
  ) => BlockPosition[] | null;
}

/**
 * Selection Bounding Box business logic interface
 *
 * This interface defines all business operations performed by the bounding box.
 * In production environments, it performs actual API calls,
 * while in test/storybook environments, mock implementations can be injected.
 *
 * @interface SelectionBoundingBoxBusinessLogic
 */
export interface SelectionBoundingBoxBusinessLogic {
  /**
   * Updates node positions in React Flow during drag
   *
   * @param nodePositions - Array of node positions to update
   * @example
   * ```tsx
   * business.updateNodePositions([
   *   { id: 'node-1', x: 100, y: 200 },
   *   { id: 'node-2', x: 300, y: 400 }
   * ]);
   * ```
   */
  updateNodePositions: (
    nodePositions: Array<{ id: string; x: number; y: number }>
  ) => void;

  /**
   * Saves block positions to the server
   *
   * @param blockPositions - Array of block positions to save
   * @returns Promise<void> - Resolves when save is complete
   * @example
   * ```tsx
   * await business.saveBlockPositions([
   *   { blockId: 'block-1', position: { x: 100, y: 200 } }
   * ]);
   * ```
   */
  saveBlockPositions: (blockPositions: BlockPosition[]) => Promise<void>;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * Selection Bounding Box Component Props
 *
 * @interface SelectionBoundingBoxProps
 */
export interface SelectionBoundingBoxProps {
  /**
   * Unique ID of the organization
   * Used for permission validation and data access control
   */
  orgId: string;

  /**
   * Unique ID of the workspace
   * Used for context identification during block transformation operations
   */
  workspaceId: string;

  /**
   * Business logic injection (optional)
   *
   * By default, the actual business logic for production environments is used,
   * but mock logic can be injected in test or storybook environments.
   *
   * @default undefined - Uses default business logic when omitted
   *
   * @example
   * ```tsx
   * // Production (default)
   * <SelectionBoundingBox orgId="org-1" workspaceId="ws-1" />
   *
   * // Test/Storybook (Mock injection)
   * const mockBusiness = useMockSelectionBoundingBoxBusiness();
   * <SelectionBoundingBox
   *   orgId="org-1"
   *   workspaceId="ws-1"
   *   businessLogic={mockBusiness}
   * />
   * ```
   */
  businessLogic?: SelectionBoundingBoxBusinessLogic;
}

/**
 * Selection Bounding Box Hook return type
 *
 * This interface defines all values returned by the `useSelectionBoundingBox` hook.
 * It includes UI state, handler functions, and visibility information.
 *
 * @interface UseSelectionBoundingBoxReturn
 */
export interface UseSelectionBoundingBoxReturn {
  /**
   * Bounding box bounds in screen coordinates
   * Returns `null` if no blocks are selected or bounds cannot be calculated
   */
  bounds: BoundingBoxBounds | null;

  /**
   * Reference to the bounding box DOM element
   * Used for positioning calculations or external click detection
   */
  boundingBoxRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Handler to start dragging
   * @param e - Pointer event
   * @example
   * ```tsx
   * const { handleMouseDown } = useSelectionBoundingBox(props);
   * <div onPointerDown={handleMouseDown} />
   * ```
   */
  handleMouseDown: (e: React.PointerEvent) => void;

  /**
   * Whether the bounding box should be visible
   * Returns `true` when multi-selection mode is active, at least 2 blocks are selected, and bounds are calculated
   * @example
   * ```tsx
   * const { isVisible } = useSelectionBoundingBox(props);
   * if (!isVisible) return null;
   * ```
   */
  isVisible: boolean;
}
