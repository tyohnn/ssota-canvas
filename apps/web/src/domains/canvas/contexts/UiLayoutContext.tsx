"use client";

import React, { createContext, useContext } from "react";
import { useUiLayoutHandler } from "@/domains/canvas/handlers/useUiLayoutHandler";

const UiLayoutContext = createContext<ReturnType<
  typeof useUiLayoutHandler
> | null>(null);

export function useUiLayout(): ReturnType<typeof useUiLayoutHandler> {
  const ctx = useContext(UiLayoutContext);
  if (!ctx)
    throw new Error("useUiLayout must be used within a UiLayoutProvider");
  return ctx;
}

export function UiLayoutProvider({ children }: { children: React.ReactNode }) {
  const uiLayoutState = useUiLayoutHandler();

  return (
    <UiLayoutContext.Provider value={uiLayoutState}>
      {children}
    </UiLayoutContext.Provider>
  );
}
