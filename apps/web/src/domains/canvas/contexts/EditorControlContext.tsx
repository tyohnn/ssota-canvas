"use client";

import React, { createContext, useContext } from "react";
import { useEditorControl } from "@/domains/canvas/components/editor/useEditorControl";

const EditorControlContext = createContext<ReturnType<
  typeof useEditorControl
> | null>(null);

export function useEditorControlContext(): ReturnType<typeof useEditorControl> {
  const ctx = useContext(EditorControlContext);
  if (!ctx)
    throw new Error(
      "useEditorControlContext must be used within an EditorControlProvider"
    );
  return ctx;
}

export function EditorControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const editorControl = useEditorControl();

  return (
    <EditorControlContext.Provider value={editorControl}>
      {children}
    </EditorControlContext.Provider>
  );
}
