import { useCallback } from 'react';

import type {
  ColorToken,
  DomainDependencies,
  EdgeShape,
  EdgeToolbarBusinessLogic,
  EdgeWidth,
  ThemeDependencies,
} from './types';

/**
 * Production business logic
 * Makes actual API calls and updates domain state
 */
export function useEdgeToolbarBusiness(
  { updateEdgeShape, updateEdgeStyle, deleteEdge }: DomainDependencies,
  { theme, getHexColor, getHexColorDark }: ThemeDependencies
): EdgeToolbarBusinessLogic {
  const updateShape = useCallback(
    async (edgeId: string, shape: EdgeShape): Promise<boolean> => {
      return await updateEdgeShape({ edgeId, newShape: shape });
    },
    [updateEdgeShape]
  );

  const updateColor = useCallback(
    async (edgeId: string, colorToken: ColorToken): Promise<boolean> => {
      const hexColor =
        theme === 'dark'
          ? getHexColorDark(colorToken)
          : getHexColor(colorToken);

      return await updateEdgeStyle({
        edgeId,
        style: {
          stroke: hexColor,
        },
      });
    },
    [updateEdgeStyle, theme, getHexColor, getHexColorDark]
  );

  const updateWidth = useCallback(
    async (edgeId: string, width: EdgeWidth): Promise<boolean> => {
      return await updateEdgeStyle({
        edgeId,
        style: {
          strokeWidth: width,
        },
      });
    },
    [updateEdgeStyle]
  );

  const deleteEdgeHandler = useCallback(
    async (edgeId: string): Promise<boolean> => {
      return await deleteEdge({ edgeId });
    },
    [deleteEdge]
  );

  return {
    updateShape,
    updateColor,
    updateWidth,
    deleteEdge: deleteEdgeHandler,
  };
}

/**
 * Mock business logic (for no-code tools)
 * Tests behavior locally without actual API calls
 */
export function useMockEdgeToolbarBusiness(): EdgeToolbarBusinessLogic {
  const updateShape = useCallback(
    async (edgeId: string, shape: EdgeShape): Promise<boolean> => {
      console.log('[Mock] Updating edge shape:', edgeId, shape);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const updateColor = useCallback(
    async (edgeId: string, colorToken: ColorToken): Promise<boolean> => {
      console.log('[Mock] Updating edge color:', edgeId, colorToken);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const updateWidth = useCallback(
    async (edgeId: string, width: EdgeWidth): Promise<boolean> => {
      console.log('[Mock] Updating edge width:', edgeId, width);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  const deleteEdgeHandler = useCallback(
    async (edgeId: string): Promise<boolean> => {
      console.log('[Mock] Deleting edge:', edgeId);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  return {
    updateShape,
    updateColor,
    updateWidth,
    deleteEdge: deleteEdgeHandler,
  };
}
