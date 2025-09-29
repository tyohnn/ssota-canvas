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

export function useViewContext(): ViewContextValue {
  const ctx = React.useContext(ViewContext);
  if (!ctx) throw new Error('useViewContext must be used within ViewProvider');
  return ctx;
}
