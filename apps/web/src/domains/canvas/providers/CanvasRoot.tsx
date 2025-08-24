"use client";

import React, { useMemo } from "react";
import type { Block, BlockPosition, Edge } from "@/db/schema";
import {
  extractComponentDefinitions,
  extractComponentInstances,
  type ComponentDefinition,
  type ComponentInstance,
} from "../types/component";
import { useBlocksStore } from "../stores/blocks.store";
import { usePositionsStore } from "../stores/positions.store";
import { useEdgesStore } from "../stores/edges.store";
import { useSelectionStore } from "../stores/selection.store";
import { CanvasDataProvider } from "../contexts/CanvasDataContext";
import { CanvasSelectionProvider } from "../contexts/CanvasSelectionContext";
import { CanvasCommandsProvider } from "../contexts/CanvasCommandsContext";
import { UiLayoutProvider } from "../contexts/UiLayoutContext";
import { EditorControlProvider } from "../contexts/EditorControlContext";

interface CanvasRootProps {
  workspaceId: string;
  initialBlocks: Block[];
  initialBlockPositions: BlockPosition[];
  initialEdges: Edge[];
  children: React.ReactNode;
}

export function CanvasRoot({
  workspaceId,
  initialBlocks,
  initialBlockPositions,
  initialEdges,
  children,
}: CanvasRootProps) {
  // Initialize all stores
  const blocksStore = useBlocksStore(initialBlocks);
  const positionsStore = usePositionsStore();
  const edgesStore = useEdgesStore(initialEdges);
  const selectionStore = useSelectionStore();

  // Optionally seed cache with initial positions if provided (kept but safe if empty)
  React.useEffect(() => {
    if (!initialBlockPositions?.length) return;
    const positionsByContext = initialBlockPositions.reduce(
      (acc, pos) => {
        const contextId = pos.context_block_id as string;
        if (!acc[contextId]) acc[contextId] = [];
        acc[contextId].push(pos);
        return acc;
      },
      {} as Record<string, BlockPosition[]>
    );
    Object.entries(positionsByContext).forEach(([contextId, positions]) => {
      positionsStore.setPagePositions(contextId, positions);
    });
  }, [initialBlockPositions, positionsStore.setPagePositions]);

  // Auto-select first page on mount if none selected
  React.useEffect(() => {
    if (selectionStore.state.pageId) return;
    const firstPage = Object.values(blocksStore.state.byId).find(
      (b) => (b.object as any) === "page"
    );
    if (firstPage?.id) {
      selectionStore.selectPage(firstPage.id as string);
    }
  }, [
    selectionStore.state.pageId,
    blocksStore.state.byId,
    selectionStore.selectPage,
  ]);

  // Component-related memoized data
  const componentData = useMemo(() => {
    const blocks = Object.values(blocksStore.state.byId);
    const definitions = extractComponentDefinitions(blocks);
    const instances = extractComponentInstances(blocks);

    const componentDefinitionsById = definitions.reduce(
      (acc, def) => {
        acc[def.id] = def;
        return acc;
      },
      {} as Record<string, ComponentDefinition>
    );

    const componentInstancesById = instances.reduce(
      (acc, inst) => {
        acc[inst.id] = inst;
        return acc;
      },
      {} as Record<string, ComponentInstance>
    );

    return {
      componentDefinitionsById,
      componentInstancesById,
      getComponentDefinitionById: (id: string) =>
        componentDefinitionsById[id] || null,
      listComponentDefinitionsByIds: (ids: string[]) =>
        ids
          .map((id) => componentDefinitionsById[id])
          .filter(Boolean) as ComponentDefinition[],
      getInstancesForDefinition: (definitionId: string) =>
        instances.filter((inst) => inst.metadata.component_id === definitionId),
      getAllComponentDefinitions: () => definitions,
      getAllComponentInstances: () => instances,
      getDefinitionForInstance: (instanceId: string) => {
        const instance = componentInstancesById[instanceId];
        return instance
          ? componentDefinitionsById[instance.metadata.component_id]
          : undefined;
      },
    };
  }, [blocksStore.state.byId]);

  // Prepare data context value
  const dataValue = useMemo(
    () => ({
      blocksById: blocksStore.state.byId,
      positionsByPage: positionsStore.positionsByPage,
      edgesById: edgesStore.state.byId,

      // Component Queries
      ...componentData,
      upsertBlock: blocksStore.upsertBlock,
      updateBlock: blocksStore.updateBlock,
      upsertBlocks: blocksStore.upsertBlocks,
      removeBlock: blocksStore.removeBlock,
      rekeyBlock: blocksStore.rekeyBlock,

      // Component Mutations
      upsertComponentDefinition: (definition: ComponentDefinition) => {
        blocksStore.upsertBlock(definition as Block);
      },
      upsertComponentInstance: (instance: ComponentInstance) => {
        blocksStore.upsertBlock(instance as Block);
      },
      removeComponentDefinition: (id: string) => {
        blocksStore.removeBlock(id);
      },
      removeComponentInstance: (id: string) => {
        blocksStore.removeBlock(id);
      },
      updateComponentDefinition: (
        id: string,
        updates: Partial<ComponentDefinition>
      ) => {
        blocksStore.updateBlock(id, updates as Partial<Block>);
      },
      updateComponentInstance: (
        id: string,
        updates: Partial<ComponentInstance>
      ) => {
        blocksStore.updateBlock(id, updates as Partial<Block>);
      },
      updateContextPositions: positionsStore.updateContextPositions,
      setPagePositions: positionsStore.setPagePositions,
      accessPage: positionsStore.accessPage,
      getPositionsForContext: positionsStore.getPositionsForContext,
      clearPageCache: positionsStore.clearPageCache,
      replaceBlockIdInContext: positionsStore.replaceBlockIdInContext,
      removePositionForBlockInContext:
        positionsStore.removePositionForBlockInContext,
      upsertEdge: edgesStore.upsertEdge,
      upsertEdges: edgesStore.upsertEdges,
      removeEdge: edgesStore.removeEdge,
      // Edge context cache
      setContextEdges: edgesStore.setContextEdges,
      clearContextEdges: edgesStore.clearContextEdges,
      accessContextEdges: edgesStore.accessContextEdges,
      getEdgesForContext: edgesStore.getEdgesForContext,
    }),
    [
      componentData,
      blocksStore.state.byId,
      blocksStore.upsertBlock,
      blocksStore.updateBlock,
      blocksStore.upsertBlocks,
      blocksStore.removeBlock,
      blocksStore.rekeyBlock,
      positionsStore.positionsByPage,
      positionsStore.updateContextPositions,
      positionsStore.setPagePositions,
      positionsStore.accessPage,
      positionsStore.getPositionsForContext,
      positionsStore.clearPageCache,
      positionsStore.replaceBlockIdInContext,
      positionsStore.removePositionForBlockInContext,
      edgesStore.state.byId,
      edgesStore.upsertEdge,
      edgesStore.upsertEdges,
      edgesStore.removeEdge,
      // Edge context cache
      edgesStore.setContextEdges,
      edgesStore.clearContextEdges,
      edgesStore.accessContextEdges,
      edgesStore.getEdgesForContext,
    ]
  );

  // Prepare selection context value
  const selectionValue = useMemo(
    () => ({
      pageId: selectionStore.state.pageId,
      componentId: selectionStore.state.componentId,
      nodeIds: selectionStore.state.nodeIds,
      edgeId: selectionStore.state.edgeId,
      canvasMode: selectionStore.canvasMode,
      selectPage: selectionStore.selectPage,
      selectComponent: selectionStore.selectComponent,
      setNodeSelection: selectionStore.setNodeSelection,
      selectEdge: selectionStore.selectEdge,
      clearAll: selectionStore.clearAll,
    }),
    [
      selectionStore.state.pageId,
      selectionStore.state.componentId,
      selectionStore.state.nodeIds,
      selectionStore.state.edgeId,
      selectionStore.canvasMode,
      selectionStore.selectPage,
      selectionStore.selectComponent,
      selectionStore.setNodeSelection,
      selectionStore.selectEdge,
      selectionStore.clearAll,
    ]
  );

  return (
    <CanvasDataProvider value={dataValue}>
      <CanvasSelectionProvider value={selectionValue}>
        <UiLayoutProvider>
          <EditorControlProvider>
            <CanvasCommandsProvider
              workspaceId={workspaceId}
              blocksById={blocksStore.state.byId}
              upsertBlock={blocksStore.upsertBlock}
              updateBlock={blocksStore.updateBlock}
              removeBlock={blocksStore.removeBlock}
              rekeyBlock={blocksStore.rekeyBlock}
              selectPage={selectionStore.selectPage}
              updateContextPositions={positionsStore.updateContextPositions}
              setPagePositions={positionsStore.setPagePositions}
              replaceBlockIdInContext={positionsStore.replaceBlockIdInContext}
              setNodeSelection={selectionStore.setNodeSelection}
            >
              {children}
            </CanvasCommandsProvider>
          </EditorControlProvider>
        </UiLayoutProvider>
      </CanvasSelectionProvider>
    </CanvasDataProvider>
  );
}
