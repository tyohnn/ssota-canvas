"use client";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { SelectionProvider } from "../contexts/SelectionContext";
import { PanelProvider } from "../contexts/PanelContext";
import { ControlProvider } from "../contexts/ControlContext";

interface RootProviderProps {
  children: React.ReactNode;
}

/**
 * React Flow Canvas의 모든 Provider를 관리하는 Root Provider
 * Provider 순서가 중요하므로 여기서 관리
 */
export function RootProvider({ children }: RootProviderProps) {
  return (
    <ReactFlowProvider>
      <ControlProvider>
        <SelectionProvider>
          <PanelProvider>
            {children}
          </PanelProvider>
        </SelectionProvider>
      </ControlProvider>
    </ReactFlowProvider>
  );
}
