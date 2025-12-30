import { type RefObject, useRef } from 'react';

/**
 * UI State Hook for Edge Toolbar
 *
 * Pure UI logic that can be used by designers in Storybook/no-code tools
 * - No business logic (API calls, data validation, etc.)
 * - Only handles local state management
 * - Can be tested independently in no-code environments
 */

export interface EdgeToolbarUIState {
  // UI state
  toolbarRef: RefObject<HTMLDivElement | null>;
}

export function useEdgeToolbarUI(): EdgeToolbarUIState {
  const toolbarRef = useRef<HTMLDivElement>(null);

  return {
    toolbarRef,
  };
}
