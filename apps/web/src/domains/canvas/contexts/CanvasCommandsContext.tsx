"use client";

import React, { createContext, useContext } from "react";
import { useCanvasCommands } from "../hooks/useCanvasCommands";
import type { Block } from "@/db/schema";

const CanvasCommandsContext = createContext<ReturnType<
  typeof useCanvasCommands
> | null>(null);

export function useCanvasCommandsContext() {
  const ctx = useContext(CanvasCommandsContext);
  if (!ctx)
    throw new Error(
      "useCanvasCommandsContext must be used within a CanvasCommandsProvider"
    );
  return ctx;
}

export function CanvasCommandsProvider({
  workspaceId,
  blocksById,
  upsertBlock,
  updateBlock,
  removeBlock,
  rekeyBlock,
  setPagePositions,
  selectPage,
  updateContextPositions,
  replaceBlockIdInContext,
  setNodeSelection,
  children,
}: {
  workspaceId: string;
  blocksById: Record<string, Block>;
  upsertBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  rekeyBlock: (fromId: string, toId: string, updates?: Partial<Block>) => void;
  setPagePositions: (pageId: string, positions: any[]) => void;
  selectPage: (id: string | null) => void;
  updateContextPositions: (
    contextId: string,
    updates: { id: string; x: number; y: number }[]
  ) => void;
  replaceBlockIdInContext: (
    contextId: string,
    fromId: string,
    toId: string
  ) => void;
  setNodeSelection: (ids: string[]) => void;
  children: React.ReactNode;
}) {
  const commands = useCanvasCommands({
    workspaceId,
    blocksById,
    upsertBlock,
    updateBlock,
    removeBlock,
    rekeyBlock,
    setPagePositions,
    selectPage,
    updateContextPositions,
    replaceBlockIdInContext,
    setNodeSelection,
  });

  return (
    <CanvasCommandsContext.Provider value={commands}>
      {children}
    </CanvasCommandsContext.Provider>
  );
}
