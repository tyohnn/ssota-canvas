import { useCallback, useEffect } from 'react';

import { useReactFlow, useStore, useViewport } from '@xyflow/react';

import { useBlockTransformOperations } from '@/domains/canvas-management/frontend/hooks/block/use-block-transform-operations';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';

import type {
  DomainDependencies,
  FlowDependencies,
  MultiSelectionToolbarBusinessLogic,
  MultiSelectionToolbarProps,
  UseMultiSelectionToolbarReturn,
} from './types';
import { useMultiSelectionToolbarBusiness } from './use-multi-selection-toolbar.business';
import { useMultiSelectionToolbarUI } from './use-multi-selection-toolbar.ui';

/**
 * Multi-Selection Toolbar Hook
 *
 * Integrates UI state and business logic for the toolbar displayed when multiple blocks are selected on the canvas.
 * This hook provides handlers to perform operations such as aligning, distributing, duplicating, and deleting selected blocks.
 *
 * @param props - Toolbar configuration and required parameters
 * @param props.pageId - Current page ID
 * @param props.orgId - Organization ID
 * @param props.workspaceId - Workspace ID
 * @param [businessLogic] - Optional business logic injection
 *   - **Production**: Uses default business logic when omitted (includes API calls)
 *   - **Test/Mock**: Inject mock business logic for unit testing
 *   - **Storybook**: Inject mock for no-code environments for use in design systems
 *
 * @returns Object containing toolbar UI state, handler functions, and selection state information
 *
 * @example
 * ```tsx
 * // Basic usage (Production)
 * function MyCanvas() {
 *   const toolbar = useMultiSelectionToolbar({
 *     pageId: 'page-123',
 *     orgId: 'org-456',
 *     workspaceId: 'workspace-789',
 *   });
 *
 *   return (
 *     <div>
 *       {toolbar.isMultiSelectionMode && (
 *         <Toolbar
 *           position={toolbar.toolbarPosition}
 *           onAlign={toolbar.handleAlign}
 *           onDelete={toolbar.handleDelete}
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
 *   const mockBusiness = useMockMultiSelectionToolbarBusiness();
 *   const toolbar = useMultiSelectionToolbar(
 *     { pageId: 'test', orgId: 'test', workspaceId: 'test' },
 *     mockBusiness
 *   );
 *   // ...
 * }
 * ```
 *
 * @see {@link MultiSelectionToolbarProps} - Props type definition
 * @see {@link UseMultiSelectionToolbarReturn} - Return type definition
 * @see {@link MultiSelectionToolbarBusinessLogic} - Business logic interface
 */
export function useMultiSelectionToolbar(
  props: MultiSelectionToolbarProps,
  businessLogic?: MultiSelectionToolbarBusinessLogic
): UseMultiSelectionToolbarReturn {
  // 1. Gather External Dependencies (Centralized)
  const selectedNodes = useStore(state =>
    state.nodes.filter(node => node.selected)
  );
  const viewport = useViewport();
  const { deleteElements, setNodes, getNodes } = useReactFlow();

  const flowDependencies: FlowDependencies = {
    setNodes,
    deleteElements,
  };

  // Gather Domain Dependencies
  const transform = useBlockTransformOperations({
    reactFlow: {
      getNodes,
      setNodes,
      addNodes: () => {},
      deleteElements,
    },
  });
  const lifecycle = useCanvasBlockLifecycle({
    pageId: props.pageId,
  });
  const { isMultiSelectionMode, exitToDefaultMode } = useCanvasMode();

  const domainDependencies: DomainDependencies = {
    alignBlocks: transform.alignBlocks,
    distributeBlocks: transform.distributeBlocks,
    duplicateMultipleBlocksAndMount: lifecycle.duplicateMultipleBlocksAndMount,
    exitToDefaultMode,
  };

  // 2. UI State (Designer Area) - Dependency Injection
  const uiState = useMultiSelectionToolbarUI({
    selectedNodes,
    viewport,
  });

  // Prevent pinch zoom on toolbar element (Side effect handled in entry hook)
  usePreventPinchZoom(uiState.toolbarRef);

  // 3. Business Logic (Engineer Area) - Dependency Injection
  const defaultBusiness = useMultiSelectionToolbarBusiness(
    flowDependencies,
    domainDependencies
  );
  const business = businessLogic ?? defaultBusiness;

  // Selection State
  const { getSelectedBlocks, getSelectionCount } = useCanvasSelection();

  const selectedBlockIds = getSelectedBlocks();
  const selectionCount = getSelectionCount();

  // Handlers
  const handleAlign = useCallback(
    (alignmentType: Parameters<typeof business.alignBlocks>[1]) => {
      business.alignBlocks(selectedBlockIds, alignmentType);
    },
    [business, selectedBlockIds]
  );

  const handleDistribute = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      business.distributeBlocks(selectedBlockIds, direction);
    },
    [business, selectedBlockIds]
  );

  const handleDuplicate = useCallback(async () => {
    try {
      await business.duplicateSelectedBlocks(selectedBlockIds, selectedNodes);
    } catch (error) {
      console.error('Multiple blocks duplication failed:', error);
    }
  }, [business, selectedBlockIds, selectedNodes]);

  const handleDelete = useCallback(async () => {
    // 1. Immediately remove from React Flow (Optimistic UI)
    business.deleteBlocks(selectedBlockIds);

    // 2. Return to default mode
    exitToDefaultMode();
  }, [business, selectedBlockIds, exitToDefaultMode]);

  const handleEscape = useCallback(() => {
    business.exitSelection();
  }, [business]);

  // ESC key handler to exit selection mode
  useEffect(() => {
    if (!isMultiSelectionMode()) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMultiSelectionMode, handleEscape]);

  // Calculate visibility: toolbar should be visible when:
  // - Multi-selection mode is active
  // - At least 2 blocks are selected
  // - Toolbar position is calculated
  const isVisible =
    isMultiSelectionMode() &&
    selectionCount >= 2 &&
    uiState.toolbarPosition !== null;

  return {
    toolbarPosition: uiState.toolbarPosition,
    toolbarRef: uiState.toolbarRef,
    handleAlign,
    handleDistribute,
    handleDuplicate,
    handleDelete,
    handleEscape,
    selectedBlockIds,
    selectionCount,
    isMultiSelectionMode: isMultiSelectionMode(),
    isVisible,
  };
}
