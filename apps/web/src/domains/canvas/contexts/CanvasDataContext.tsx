'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import type { Block } from '@/db/schema';
import { usePageBlockStore } from '@/domains/canvas/stores/page-block.store';
import { useComponentBlockStore } from '@/domains/block-components/stores/component-block.store';
import { useSelectionStore } from '@/domains/canvas/stores/selection.store';
import type { ComponentDefinition } from '@/domains/block-components/types/component.types';
import { cosineDistance } from 'drizzle-orm';

export type CanvasDataContextValue = {
  // Page Block Queries
  pageBlocks: Block[];
  getPageBlockById: (id: string) => Block | undefined;
  selectedPageBlock: Block | null;

  // Component Block Queries
  componentBlocks: ComponentDefinition[];
  getComponentBlockById: (id: string) => ComponentDefinition | undefined;
  selectedComponentBlock: ComponentDefinition | null;

  // Page Block Mutations
  setPageBlocks: (pageBlocks: Block[]) => void;
  addPageBlock: (pageBlock: Block) => void;
  removePageBlock: (id: string) => void;
  updatePageBlock: (id: string, updates: Partial<Block>) => void;
  replacePageBlockId: (
    fromId: string,
    toId: string,
    updates?: Partial<Block>
  ) => void;

  // Component Block Mutations
  setComponentBlocks: (componentBlocks: ComponentDefinition[]) => void;
  addComponentBlock: (componentBlock: ComponentDefinition) => void;
  removeComponentBlock: (id: string) => void;
  updateComponentBlock: (
    id: string,
    updates: Partial<ComponentDefinition>
  ) => void;
  replaceComponentBlockId: (
    fromId: string,
    toId: string,
    updates?: Partial<ComponentDefinition>
  ) => void;

  // Selection
  selectedPageId: string | null;
  selectedComponentId: string | null;
  contextBlockId: string | null;
  canvasMode: 'page' | 'component';
  selectPage: (id: string | null) => void;
  selectComponent: (id: string | null) => void;
};

const CanvasDataContext = createContext<CanvasDataContextValue | null>(null);

export function useCanvasData(): CanvasDataContextValue {
  const ctx = useContext(CanvasDataContext);
  if (!ctx)
    throw new Error('useCanvasData must be used within a CanvasDataProvider');
  return ctx;
}

export function CanvasDataProvider({
  initialPageBlocks,
  initialComponentBlocks,
  children,
}: {
  initialPageBlocks: Block[];
  initialComponentBlocks: ComponentDefinition[];
  children: React.ReactNode;
}) {
  // Initialize all stores
  const pageBlockStore = usePageBlockStore(initialPageBlocks);
  const componentBlockStore = useComponentBlockStore(initialComponentBlocks);
  const selectionStore = useSelectionStore();

  // Auto-select first page on mount if none selected
  useEffect(() => {
    if (selectionStore.state.selectedPageId) return;
    const firstPage = pageBlockStore.pageBlocks.find(
      b => (b.object as any) === 'page'
    );
    if (firstPage?.id) {
      selectionStore.selectPage(firstPage.id as string);
    }
  }, [pageBlockStore.pageBlocks, selectionStore.selectPage]);

  // Build context value
  const contextValue = useMemo(() => {
    const pageBlocks = pageBlockStore.pageBlocks;
    const componentBlocks = componentBlockStore.componentBlocks;

    // Get selected blocks
    const selectedPageBlock = selectionStore.state.selectedPageId
      ? pageBlockStore.getPageBlockById(selectionStore.state.selectedPageId) ||
        null
      : null;
    const selectedComponentBlock = selectionStore.state.selectedComponentId
      ? componentBlockStore.getComponentBlockById(
          selectionStore.state.selectedComponentId
        ) || null
      : null;

    const contextBlockId =
      selectionStore.state.selectedComponentId ||
      selectionStore.state.selectedPageId ||
      null;

    return {
      // Page Block Queries
      pageBlocks,
      getPageBlockById: pageBlockStore.getPageBlockById,
      selectedPageBlock,

      // Component Block Queries
      componentBlocks,
      getComponentBlockById: componentBlockStore.getComponentBlockById,
      selectedComponentBlock,

      // Page Block Mutations
      setPageBlocks: pageBlockStore.setPageBlocks,
      addPageBlock: pageBlockStore.addPageBlock,
      removePageBlock: pageBlockStore.removePageBlock,
      updatePageBlock: pageBlockStore.updatePageBlock,
      replacePageBlockId: pageBlockStore.replacePageBlockId,

      // Component Block Mutations
      setComponentBlocks: componentBlockStore.setComponentBlocks,
      addComponentBlock: componentBlockStore.addComponentBlock,
      removeComponentBlock: componentBlockStore.removeComponentBlock,
      updateComponentBlock: componentBlockStore.updateComponentBlock,
      replaceComponentBlockId: componentBlockStore.replaceComponentBlockId,

      // Selection
      selectedPageId: selectionStore.state.selectedPageId,
      selectedComponentId: selectionStore.state.selectedComponentId,
      contextBlockId,
      canvasMode: selectionStore.canvasMode,
      selectPage: selectionStore.selectPage,
      selectComponent: selectionStore.selectComponent,
    };
  }, [
    pageBlockStore,
    componentBlockStore,
    selectionStore.state.selectedPageId,
    selectionStore.state.selectedComponentId,
    selectionStore.canvasMode,
    selectionStore.selectPage,
    selectionStore.selectComponent,
  ]);

  return (
    <CanvasDataContext.Provider value={contextValue}>
      {children}
    </CanvasDataContext.Provider>
  );
}
