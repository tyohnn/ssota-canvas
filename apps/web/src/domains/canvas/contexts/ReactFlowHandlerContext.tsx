"use client";

import React, { createContext, useContext } from "react";
import type { UseReactFlowHandlerResult } from "@/domains/canvas/handlers/useReactFlowHandler";

type ReactFlowHandlerContextType = UseReactFlowHandlerResult | null;

const ReactFlowHandlerContext =
  createContext<ReactFlowHandlerContextType>(null);

export function ReactFlowHandlerProvider({
  children,
  handlers,
}: {
  children: React.ReactNode;
  handlers: UseReactFlowHandlerResult;
}) {
  return (
    <ReactFlowHandlerContext.Provider value={handlers}>
      {children}
    </ReactFlowHandlerContext.Provider>
  );
}

export function useReactFlowHandlerContext() {
  const context = useContext(ReactFlowHandlerContext);
  if (!context) {
    throw new Error(
      "useReactFlowHandlerContext must be used within ReactFlowHandlerProvider"
    );
  }
  return context;
}
