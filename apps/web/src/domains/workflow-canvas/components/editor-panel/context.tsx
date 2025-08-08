"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  useEditorPanelHandler,
  EditorTab,
} from "@/domains/workflow-canvas/hooks";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";

interface EditorPanelContextType {
  state: ReturnType<typeof useEditorPanelHandler>["state"];
  handlers: ReturnType<typeof useEditorPanelHandler>["handlers"];
  handleCloseEditorWithCentering: ReturnType<
    typeof useEditorPanelHandler
  >["handleCloseEditorWithCentering"];
  showEditorPanel: boolean;
  handleBlockUpdate: (
    blockId: string,
    updates: Partial<DbBlock>
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  handleEdgeUpdate: (edgeId: string, updates: any) => Promise<void>;
  closeEditorPanel: () => void;
}

export type { EditorTab };

const EditorPanelContext = createContext<EditorPanelContextType | null>(null);

interface EditorPanelProviderProps {
  children: ReactNode;
}

export function EditorPanelProvider({ children }: EditorPanelProviderProps) {
  const editorPanelHandler = useEditorPanelHandler();

  return (
    <EditorPanelContext.Provider value={editorPanelHandler}>
      {children}
    </EditorPanelContext.Provider>
  );
}

export function useEditorPanelContext() {
  const context = useContext(EditorPanelContext);
  if (!context) {
    throw new Error(
      "useEditorPanelContext must be used within EditorPanelProvider"
    );
  }
  return context;
}
