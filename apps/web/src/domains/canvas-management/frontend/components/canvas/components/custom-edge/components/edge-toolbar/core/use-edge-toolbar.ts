import { useCallback, useMemo } from 'react';

import { useTheme } from 'next-themes';

import { useViewport } from '@xyflow/react';

import {
  ColorToken,
  getColorTokenFromHex,
  getHexColor,
  getHexColorDark,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { useCanvasEdgeManagement } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-management';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';

import type {
  DomainDependencies,
  EdgeShape,
  EdgeState,
  EdgeToolbarBusinessLogic,
  EdgeToolbarProps,
  EdgeWidth,
  ThemeDependencies,
  UseEdgeToolbarReturn,
} from './types';
import { useEdgeToolbarBusiness } from './use-edge-toolbar.business';
import { useEdgeToolbarUI } from './use-edge-toolbar.ui';

/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useEdgeToolbar(
  props: EdgeToolbarProps,
  businessLogic?: EdgeToolbarBusinessLogic
): UseEdgeToolbarReturn {
  // 1. Gather External Dependencies (The only place where external hooks are called)
  // Framework / Library Hooks
  const { zoom } = useViewport();
  const { theme } = useTheme();

  // Calculate visibility based on zoom level (semantic zooming)
  // Hide toolbar when zoomed out too much (below 0.5) to ensure UI clarity
  const isZoomVisible = zoom >= 1.0;

  // Domain / Service Hooks
  const edgeManagement = useCanvasEdgeManagement({
    pageId: props.pageId,
  });

  // 2. Bundle Dependencies into semantic objects (Separated by concern)
  const domainDependencies: DomainDependencies = {
    getEdgeById: edgeManagement.getEdgeById,
    updateEdgeShape: edgeManagement.updateEdgeShape,
    updateEdgeStyle: edgeManagement.updateEdgeStyle,
    deleteEdge: edgeManagement.deleteEdge,
  };

  const themeDependencies: ThemeDependencies = {
    theme,
    getHexColor,
    getHexColorDark,
    getColorTokenFromHex,
  };

  // 3. Inject into UI State Hook (Designer area)
  const uiState = useEdgeToolbarUI();

  // Prevent pinch zoom on toolbar element (Side effect handled in entry hook)
  usePreventPinchZoom(uiState.toolbarRef);

  // 4. Inject into Business Logic Hook (Engineer area)
  // Pass separated dependency objects for cleaner interface
  const defaultBusiness = useEdgeToolbarBusiness(
    domainDependencies,
    themeDependencies
  );
  const business = businessLogic ?? defaultBusiness;

  // 5. Get current edge state
  const edge = edgeManagement.getEdgeById(props.edgeId);
  const currentShape = edge?.data?.actualEdgeShape || 'default';
  const currentColorHex = edge?.style?.stroke || getHexColor(ColorToken.GRAY);
  const currentColorToken = getColorTokenFromHex(currentColorHex);
  const currentWidth = edge?.style?.strokeWidth || 1.5;

  const edgeState: EdgeState = useMemo(
    () => ({
      shape: currentShape,
      colorHex: currentColorHex,
      colorToken: currentColorToken,
      width: currentWidth as number,
    }),
    [currentShape, currentColorHex, currentColorToken, currentWidth]
  );

  // 6. Compose Handlers
  const handleShapeChange = useCallback(
    async (shape: EdgeShape) => {
      const success = await business.updateShape(props.edgeId, shape);

      if (!success) {
        console.error('❌ [EdgeToolbar] Failed to update edge shape');
      }
      // Popover is uncontrolled, so it closes automatically after selection
    },
    [business, props.edgeId]
  );

  const handleColorChange = useCallback(
    async (colorToken: ColorToken) => {
      const success = await business.updateColor(props.edgeId, colorToken);

      if (!success) {
        console.error('❌ [EdgeToolbar] Failed to update edge color');
      }
    },
    [business, props.edgeId]
  );

  const handleWidthChange = useCallback(
    async (width: EdgeWidth) => {
      const success = await business.updateWidth(props.edgeId, width);

      if (!success) {
        console.error('❌ [EdgeToolbar] Failed to update edge width');
      }
      // Popover is uncontrolled, so it closes automatically after selection
    },
    [business, props.edgeId]
  );

  const handleDelete = useCallback(async () => {
    const success = await business.deleteEdge(props.edgeId);

    if (!success) {
      console.error('❌ [EdgeToolbar] Failed to delete edge');
    }
  }, [business, props.edgeId]);

  // 7. Compose and Return
  return {
    toolbarRef: uiState.toolbarRef,
    edgeState,
    handleShapeChange,
    handleColorChange,
    handleWidthChange,
    handleDelete,
    isZoomVisible,
    zoom,
  };
}
