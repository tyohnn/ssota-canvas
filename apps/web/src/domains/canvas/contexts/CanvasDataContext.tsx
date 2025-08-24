"use client";

import React, { createContext, useContext } from "react";
import type { Block, BlockPosition, Edge } from "@/db/schema";
import type {
  ComponentDefinition,
  ComponentInstance,
} from "@/domains/canvas/types/component";

export type CanvasDataContextValue = {
  // Queries
  blocksById: Record<string, Block>;
  positionsByPage: Record<
    string,
    { positions: BlockPosition[]; lastAccessed: Date }
  >;
  edgesById: Record<string, Edge>;

  // Component Queries
  componentDefinitionsById: Record<string, ComponentDefinition>;
  componentInstancesById: Record<string, ComponentInstance>;
  getComponentDefinitionById: (id: string) => ComponentDefinition | null;
  listComponentDefinitionsByIds: (ids: string[]) => ComponentDefinition[];
  getInstancesForDefinition: (definitionId: string) => ComponentInstance[];
  getAllComponentDefinitions: () => ComponentDefinition[];
  getAllComponentInstances: () => ComponentInstance[];

  // Mutations
  upsertBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  upsertBlocks: (blocks: Block[]) => void;
  removeBlock: (id: string) => void;
  rekeyBlock: (fromId: string, toId: string, updates?: Partial<Block>) => void;

  // Component Mutations
  upsertComponentDefinition: (definition: ComponentDefinition) => void;
  upsertComponentInstance: (instance: ComponentInstance) => void;
  removeComponentDefinition: (id: string) => void;
  removeComponentInstance: (id: string) => void;
  updateComponentDefinition: (
    id: string,
    updates: Partial<ComponentDefinition>
  ) => void;
  updateComponentInstance: (
    id: string,
    updates: Partial<ComponentInstance>
  ) => void;

  updateContextPositions: (
    contextId: string,
    updates: { id: string; x: number; y: number }[]
  ) => void;
  setPagePositions: (pageId: string, positions: BlockPosition[]) => void;
  // Page position cache helpers
  accessPage: (pageId: string) => void;
  getPositionsForContext: (pageId: string) => BlockPosition[];
  clearPageCache: (pageId: string) => void;
  replaceBlockIdInContext: (
    contextId: string,
    fromId: string,
    toId: string
  ) => void;
  removePositionForBlockInContext: (contextId: string, blockId: string) => void;

  upsertEdge: (edge: Edge) => void;
  upsertEdges: (edges: Edge[]) => void;
  removeEdge: (id: string) => void;
  // Edge context cache
  setContextEdges: (pageId: string, edges: Edge[]) => void;
  clearContextEdges: (pageId: string) => void;
  accessContextEdges: (pageId: string) => void;
  getEdgesForContext: (pageId: string) => Edge[];
};

const CanvasDataContext = createContext<CanvasDataContextValue | null>(null);

export function useCanvasData(): CanvasDataContextValue {
  const ctx = useContext(CanvasDataContext);
  if (!ctx)
    throw new Error("useCanvasData must be used within a CanvasDataProvider");
  return ctx;
}

export function CanvasDataProvider({
  value,
  children,
}: {
  value: CanvasDataContextValue;
  children: React.ReactNode;
}) {
  return (
    <CanvasDataContext.Provider value={value}>
      {children}
    </CanvasDataContext.Provider>
  );
}
