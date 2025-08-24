"use client";

import { useCallback } from "react";
import type {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnConnect,
  Connection,
} from "@xyflow/react";

export function useReactFlowEventAdapter({
  selectedPageId,
  updateContextPositions,
  setNodeSelection,
}: {
  selectedPageId: string | null;
  updateContextPositions: (
    contextId: string,
    updates: { id: string; x: number; y: number }[]
  ) => void;
  setNodeSelection: (ids: string[]) => void;
}) {
  const onNodeClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      evt.preventDefault();
      evt.stopPropagation();
      // Keep adapter simple: let commands/selection store handle multi-select if needed
      setNodeSelection([node.id]);
    },
    [setNodeSelection]
  );

  const onPaneClick = useCallback(
    () => setNodeSelection([]),
    [setNodeSelection]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: ReactFlowNode) => {
      const pos = node?.position;
      const contextId = selectedPageId || undefined;
      if (!pos || !contextId) return;
      updateContextPositions(contextId, [{ id: node.id, x: pos.x, y: pos.y }]);
    },
    [selectedPageId, updateContextPositions]
  );

  const onNodeDimensionsChange = useCallback((_changes: any[]) => {
    // size persistence is handled by a command in the future
  }, []);

  const onNodeDataChange = useCallback((_changes: any[]) => {
    // data persistence is handled by a command in the future
  }, []);

  const onConnect = useCallback<OnConnect>((_connection: Connection) => {
    // connect edge command in the future
  }, []);

  return {
    onNodeClick,
    onPaneClick,
    onNodeDragStop,
    onNodeDimensionsChange,
    onNodeDataChange,
    onConnect,
  } as const;
}
