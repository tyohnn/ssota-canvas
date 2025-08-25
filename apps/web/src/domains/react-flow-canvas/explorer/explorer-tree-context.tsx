"use client";

import React, { createContext, useContext } from "react";
import type { ExplorerTreeContextValue } from "./types";

// Context 생성
const ExplorerTreeContext = createContext<ExplorerTreeContextValue<any> | null>(
  null
);

// Provider Props 타입
interface ExplorerTreeProviderProps<TSourceData> {
  children: React.ReactNode;
  value: ExplorerTreeContextValue<TSourceData>;
}

// Provider 컴포넌트
export function ExplorerTreeProvider<TSourceData>({
  children,
  value,
}: ExplorerTreeProviderProps<TSourceData>) {
  return (
    <ExplorerTreeContext.Provider value={value}>
      {children}
    </ExplorerTreeContext.Provider>
  );
}

// Context 소비 훅
export function useExplorerTreeContext<
  TSourceData,
>(): ExplorerTreeContextValue<TSourceData> {
  const context = useContext(ExplorerTreeContext);
  if (!context) {
    throw new Error(
      "useExplorerTreeContext must be used within an ExplorerTreeProvider"
    );
  }
  return context as ExplorerTreeContextValue<TSourceData>;
}

// Context 존재 여부 확인 훅
export function useExplorerTreeContextSafe<
  TSourceData,
>(): ExplorerTreeContextValue<TSourceData> | null {
  return useContext(
    ExplorerTreeContext
  ) as ExplorerTreeContextValue<TSourceData> | null;
}
