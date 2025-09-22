"use client";

import React, { createContext, useContext } from "react";
import { useReactFlowCommands } from "@/domains/react-flow-canvas/hooks/useReactFlowCommands";

const ReactFlowCommandsContext = createContext<ReturnType<
  typeof useReactFlowCommands
> | null>(null);

export function useReactFlowCommandsContext(): ReturnType<typeof useReactFlowCommands> {
  const ctx = useContext(ReactFlowCommandsContext);
  if (!ctx)
    throw new Error("useReactFlowCommandsContext must be used within a ReactFlowCommandsProvider");
  return ctx;
}

export function ReactFlowCommandsProvider({ children }: { children: React.ReactNode }) {
  const state = useReactFlowCommands();

  return (
    <ReactFlowCommandsContext.Provider value={state}>
      {children}
    </ReactFlowCommandsContext.Provider>
  );
}
