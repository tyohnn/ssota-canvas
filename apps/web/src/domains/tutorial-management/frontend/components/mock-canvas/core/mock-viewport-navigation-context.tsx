'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useTutorialDialogContext } from '@/domains/tutorial-management/frontend/components/tutorial-dialog/core/context';

export interface MockViewportNavigationContextValue {
  navigateToBlock: (nodeId: string) => void;
}

const MockViewportNavigationContext =
  createContext<MockViewportNavigationContextValue | null>(null);

export function useMockViewportNavigation(): MockViewportNavigationContextValue {
  const ctx = useContext(MockViewportNavigationContext);
  if (!ctx) {
    return {
      navigateToBlock: () => { },
    };
  }
  return ctx;
}

interface MockViewportNavigationProviderProps {
  children?: ReactNode;
}

/**
 * Provides viewport navigation for tutorial (e.g. auto-pan to block when step changes).
 * Must be used inside ReactFlow so useReactFlow() is available.
 */
function MockViewportNavigationProviderInner({
  children,
}: MockViewportNavigationProviderProps) {
  const reactFlow = useReactFlow();

  const navigateToBlock = useCallback(
    (nodeId: string) => {
      if (!reactFlow) return;
      try {
        const node = reactFlow.getNode(nodeId) as Node | undefined;
        if (!node) return;
        const { position } = node;
        const width = (node.measured?.width ?? node.width) ?? 200;
        const height = (node.measured?.height ?? node.height) ?? 150;
        const centerX = position.x + width / 2;
        const centerY = position.y + height / 2;
        reactFlow.setCenter(centerX, centerY, { duration: 400, zoom: 1 });
      } catch {
        // no-op when React Flow not ready
      }
    },
    [reactFlow]
  );

  const value = useMemo<MockViewportNavigationContextValue>(
    () => ({ navigateToBlock }),
    [navigateToBlock]
  );

  return (
    <MockViewportNavigationContext.Provider value={value}>
      {children}
    </MockViewportNavigationContext.Provider>
  );
}

/**
 * Runs when step changes to block-node: navigates viewport to last placed block.
 * Must be inside MockViewportNavigationProvider and ReactFlow.
 */
function ViewportNavigationEffect() {
  const { currentStep, tutorialState } = useTutorialDialogContext();
  const { navigateToBlock } = useMockViewportNavigation();
  const lastPlacedNodeId = tutorialState?.lastPlacedNodeId as string | undefined;

  useEffect(() => {
    const blockNodeStep =
      currentStep?.targetSelector === 'block-node' ||
      currentStep?.interactableSelectors?.includes('block-node');
    if (
      !lastPlacedNodeId ||
      !blockNodeStep ||
      currentStep?.action !== 'click'
    ) {
      return;
    }
    navigateToBlock(lastPlacedNodeId);
  }, [currentStep?.id, currentStep?.targetSelector, currentStep?.interactableSelectors, currentStep?.action, lastPlacedNodeId, navigateToBlock]);

  return null;
}

/**
 * Renders provider and effect inside ReactFlow (so useReactFlow works).
 * Render this as a child of ReactFlow, e.g. inside ReactFlow.
 */
export function MockViewportNavigationProvider({
  children,
}: MockViewportNavigationProviderProps) {
  return (
    <Panel position="top-left" className="hidden">
      <MockViewportNavigationProviderInner>
        <ViewportNavigationEffect />
        {children}
      </MockViewportNavigationProviderInner>
    </Panel>
  );
}
