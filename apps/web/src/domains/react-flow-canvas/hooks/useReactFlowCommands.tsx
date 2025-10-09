'use client';

import { useReactFlowNodeCommands } from './useReactFlowNodeCommands';
import { useReactFlowComponentCommands } from './useReactFlowComponentCommands';
import { useReactFlowStyleCommands } from './useReactFlowStyleCommands';

/**
 * Unified React Flow Commands Hook
 *
 * This hook integrates all the smaller, focused hooks to provide a unified interface
 * for React Flow operations.
 */
export function useReactFlowCommands() {
  const nodeCommands = useReactFlowNodeCommands();
  const componentCommands = useReactFlowComponentCommands();
  const styleCommands = useReactFlowStyleCommands();

  return {
    // Node Commands
    nodeCommands,

    // Component Commands
    componentCommands,

    // Style Commands
    styleCommands,

    // Component Definition Operations
    deleteComponent: componentCommands.deleteComponentDefinition,
  };
}

export type ReactFlowCommands = ReturnType<typeof useReactFlowCommands>;
