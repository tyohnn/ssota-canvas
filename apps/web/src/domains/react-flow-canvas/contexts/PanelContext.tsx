"use client";

import React, { createContext, useContext } from "react";
import { usePanelHandler } from "@/domains/react-flow-canvas/handlers/usePanelHandler";

const PanelContext = createContext<ReturnType<
  typeof usePanelHandler
> | null>(null);

export function usePanel(): ReturnType<typeof usePanelHandler> {
  const ctx = useContext(PanelContext);
  if (!ctx)
    throw new Error("usePanel must be used within a PanelProvider");
  return ctx;
}

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const state = usePanelHandler();

  return (
    <PanelContext.Provider value={state}>
      {children}
    </PanelContext.Provider>
  );
}
