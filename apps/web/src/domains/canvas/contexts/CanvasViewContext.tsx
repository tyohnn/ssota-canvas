'use client';

import React from 'react';
import { useCanvasData } from '@/domains/canvas/contexts/CanvasDataContext';
import type { ViewDefinition } from '@/domains/canvas/policy/view-policy';
import {
  getAvailableViews,
  resolveInitialViewId,
  findViewDefinition,
} from '@/domains/canvas/policy/view-policy';

export type ViewContextValue = {
  currentViewId: string; // "canvas" or a definition id
  currentViewDef: ViewDefinition | null;
  availableViews: ViewDefinition[];
  switchView: (viewId: string) => void;
};

const ViewContext = React.createContext<ViewContextValue | undefined>(
  undefined
);

/**
 * Provides a React context that tracks and controls the currently selected canvas view.
 *
 * Recomputes available view definitions when the selected page changes, ensures the
 * active view id remains valid (keeps it if still available or resolves an initial id),
 * and exposes the current view id, its resolved definition, the list of available views,
 * and a function to switch the active view.
 *
 * @returns A React provider element that supplies the view context to its children.
 */
export function ViewProvider({ children }: { children: React.ReactNode }) {
  const data = useCanvasData();

  const selectedPageBlock = data.selectedPageId
    ? data.getPageBlockById(data.selectedPageId)
    : null;

  const [currentViewId, setCurrentViewId] = React.useState<string>('canvas');
  const [availableViews, setAvailableViews] = React.useState<ViewDefinition[]>(
    []
  );

  // Recompute available views when page changes
  React.useEffect(() => {
    const defs = getAvailableViews(selectedPageBlock);
    setAvailableViews(defs);

    // Decide initial/current view
    setCurrentViewId(prev => {
      if (prev && defs.some(d => d.id === prev)) {
        return prev; // keep existing if still valid
      }
      return resolveInitialViewId(selectedPageBlock);
    });
  }, [selectedPageBlock]);

  const switchView = React.useCallback((viewId: string) => {
    setCurrentViewId(viewId);
  }, []);

  const currentViewDef = React.useMemo(
    () => findViewDefinition(selectedPageBlock, currentViewId),
    [selectedPageBlock, currentViewId]
  );

  const value: ViewContextValue = React.useMemo(
    () => ({ currentViewId, currentViewDef, availableViews, switchView }),
    [currentViewId, currentViewDef, availableViews, switchView]
  );

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

/**
 * Provides access to the current canvas view context value.
 *
 * @returns The current ViewContextValue containing `currentViewId`, `currentViewDef`, `availableViews`, and `switchView`.
 * @throws Error if called outside of a ViewProvider
 */
export function useViewContext(): ViewContextValue {
  const ctx = React.useContext(ViewContext);
  if (!ctx) throw new Error('useViewContext must be used within ViewProvider');
  return ctx;
}