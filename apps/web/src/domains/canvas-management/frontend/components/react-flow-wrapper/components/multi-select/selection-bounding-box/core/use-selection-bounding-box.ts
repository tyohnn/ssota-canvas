import { useCallback, useEffect, useRef, useState } from 'react';

import { useReactFlow, useStore, useViewport } from '@xyflow/react';

import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/control/use-prevent-pinch-zoom';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { useCanvasTransform } from '@/domains/canvas-management/frontend/hooks/use-canvas-transform';

import type {
  DomainDependencies,
  FlowDependencies,
  InitialNodePosition,
  SelectionBoundingBoxBusinessLogic,
  SelectionBoundingBoxProps,
  SelectionBoundingBoxUILogic,
  UseSelectionBoundingBoxReturn,
} from './types';
import { useSelectionBoundingBoxBusiness } from './use-selection-bounding-box.business';
import { useSelectionBoundingBoxUILogic } from './use-selection-bounding-box.ui';

/**
 * Selection Bounding Box Hook
 *
 * Integrates UI state and business logic for the bounding box displayed when multiple blocks are selected on the canvas.
 * This hook provides handlers to drag multiple selected blocks together.
 *
 * @param props - Bounding box configuration and required parameters
 * @param props.businessLogic - Optional business logic injection
 *   - **Production**: Uses default business logic when omitted (includes API calls)
 *   - **Test/Mock**: Inject mock business logic for unit testing
 *   - **Storybook**: Inject mock for no-code environments for use in design systems
 *
 * @returns Object containing bounding box UI state, handler functions, and visibility information
 *
 * @example
 * ```tsx
 * // Basic usage (Production)
 * function MyCanvas() {
 *   const boundingBox = useSelectionBoundingBox({
 *   });
 *
 *   return (
 *     <div>
 *       {boundingBox.isVisible && (
 *         <BoundingBoxView
 *           bounds={boundingBox.bounds}
 *           onMouseDown={boundingBox.handleMouseDown}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Mock business logic injection (Test/Storybook)
 * function StorybookExample() {
 *   const mockBusiness = useMockSelectionBoundingBoxBusiness();
 *   const boundingBox = useSelectionBoundingBox({
 *     businessLogic: mockBusiness,
 *   });
 *   // ...
 * }
 * ```
 *
 * @see {@link SelectionBoundingBoxProps} - Props type definition
 * @see {@link UseSelectionBoundingBoxReturn} - Return type definition
 * @see {@link SelectionBoundingBoxUILogic} - UI logic interface
 * @see {@link SelectionBoundingBoxBusinessLogic} - Business logic interface
 */
export function useSelectionBoundingBox(
  props: SelectionBoundingBoxProps,
  canvasMetadataOverride?: CanvasMetadata
): UseSelectionBoundingBoxReturn {
  const { pageId } = useCanvasMetadata(canvasMetadataOverride);

  const { businessLogic } = props;
  // 1. Gather External Dependencies (Centralized)
  const selectedNodes = useStore(
    state => state.nodes.filter(node => node.selected),
    (a, b) =>
      a.length === b.length &&
      a.every((n, i) => {
        const other = b[i];
        if (!other) return false;
        return (
          n.id === other.id &&
          n.position.x === other.position.x &&
          n.position.y === other.position.y
        );
      })
  );

  const viewport = useViewport();
  const reactFlowInstance = useReactFlow();
  const { setNodes, getNodes } = reactFlowInstance;

  const flowDependencies: FlowDependencies = {
    setNodes,
  };

  // Gather Domain Dependencies
  const transform = useCanvasTransform({
    pageId,
  });

  const domainDependencies: DomainDependencies = {
    updateBlockPosition: transform.updateBlockPosition,
  };

  // 2. UI Logic (Designer Area) - Always use production implementation
  const ui = useSelectionBoundingBoxUILogic({
    selectedNodes,
    viewport,
    getNodes,
  });

  // Prevent pinch zoom on bounding box element (Side effect handled in entry hook)
  usePreventPinchZoom(ui.boundingBoxRef);

  // 3. Business Logic (Engineer Area) - Dependency Injection
  const defaultBusiness = useSelectionBoundingBoxBusiness(
    flowDependencies,
    domainDependencies
  );
  const business = businessLogic ?? defaultBusiness;

  const { startDragging, moveDragging, endDragging, bounds, boundingBoxRef } =
    ui;

  // Selection State
  const { isMultiSelectionMode } = useCanvasModeContext();
  const { getSelectionCount } = useCanvasSelection();

  const [isDragging, setIsDragging] = useState(false);

  // Store initial positions during drag (managed by integration hook)
  const initialPositionsRef = useRef<InitialNodePosition[]>([]);

  // Handle drag movement: use UI logic to calculate positions, then update via business logic
  const handleMouseMove = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();

      const updatedPositions = moveDragging(e, initialPositionsRef.current);
      if (updatedPositions) {
        business.updateNodePositions(updatedPositions);
      }
    },
    [moveDragging, business, isDragging]
  );

  // Handle drag end: use UI logic to calculate changed positions, then save via business logic
  const handleMouseUp = useCallback(
    async (e: PointerEvent) => {
      e.preventDefault();

      // Calculate changed positions using UI logic
      const changedPositions = endDragging(e, initialPositionsRef.current);

      // Save to server via business logic if there are changes
      if (changedPositions && changedPositions.length > 0) {
        business.saveBlockPositions(changedPositions).catch(err => {
          console.error(
            '[SelectionBoundingBox] Failed to save positions:',
            err
          );
        });
      }

      initialPositionsRef.current = [];
      setIsDragging(false);
    },
    [endDragging, business]
  );

  // Handle drag start: use UI logic to initialize drag state
  const handleMouseDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Store initial positions using UI logic
      initialPositionsRef.current = startDragging(e);
      setIsDragging(true);
    },
    [startDragging]
  );

  // Manage document event listeners based on isDragging state
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('pointermove', handleMouseMove);
    document.addEventListener('pointerup', handleMouseUp);

    return () => {
      document.removeEventListener('pointermove', handleMouseMove);
      document.removeEventListener('pointerup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate visibility: bounding box should be visible when:
  // - Multi-selection mode is active
  // - At least 2 blocks are selected
  // - Bounds are calculated
  const selectionCount = getSelectionCount();
  const isVisible =
    isMultiSelectionMode() && selectionCount >= 2 && ui.bounds !== null;

  return {
    bounds: ui.bounds,
    boundingBoxRef: ui.boundingBoxRef,
    handleMouseDown,
    isVisible,
  };
}
