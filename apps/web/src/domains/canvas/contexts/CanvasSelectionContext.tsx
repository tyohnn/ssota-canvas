"use client";

import React, { createContext, useContext } from "react";

export type CanvasMode = "page" | "component";

export type CanvasSelectionContextValue = {
  pageId: string | null;
  componentId: string | null;
  nodeIds: string[];
  edgeId: string | null;
  canvasMode: CanvasMode;
  selectPage: (id: string | null) => void;
  selectComponent: (id: string | null) => void;
  setNodeSelection: (ids: string[]) => void;
  selectEdge: (id: string | null) => void;
  clearAll: () => void;
};

const CanvasSelectionContext =
  createContext<CanvasSelectionContextValue | null>(null);

export function useCanvasSelection(): CanvasSelectionContextValue {
  const ctx = useContext(CanvasSelectionContext);
  if (!ctx)
    throw new Error(
      "useCanvasSelection must be used within a CanvasSelectionProvider"
    );
  return ctx;
}

export function CanvasSelectionProvider({
  value,
  children,
}: {
  value: CanvasSelectionContextValue;
  children: React.ReactNode;
}) {
  return (
    <CanvasSelectionContext.Provider value={value}>
      {children}
    </CanvasSelectionContext.Provider>
  );
}
