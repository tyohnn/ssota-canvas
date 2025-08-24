"use client";

import { useCallback, useMemo } from "react";
import { useCanvasData } from "../contexts/CanvasDataContext";
import { useCanvasSelection } from "../contexts/CanvasSelectionContext";
import { useCanvasCommandsContext } from "../contexts/CanvasCommandsContext";
import type {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnConnect,
  Connection,
} from "@xyflow/react";

export type UseReactFlowHandlerResult = {
  _onNodesChange: (changes: any[]) => void;
  onNodeDimensionsChange: (changes: any[]) => void;
  onNodeDataChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onEdgeClick: (evt: React.MouseEvent, edge: ReactFlowEdge) => void;
  onPaneClick: () => void;
  onConnect: OnConnect;
  onNodeDragStart: () => void;
  onNodeDragStop: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onNodeDoubleClick: (evt: React.MouseEvent, node: ReactFlowNode) => void;
  onEdgeDoubleClick: (evt: React.MouseEvent, edge: ReactFlowEdge) => void;
  onNodesDelete: (nodes: ReactFlowNode[]) => void;
  onEdgesDelete: (edges: ReactFlowEdge[]) => void;
  onConnectStart: () => void;
  onConnectEnd: () => void;
};

export function useReactFlowHandler(): UseReactFlowHandlerResult {
  const data = useCanvasData();
  const sel = useCanvasSelection();
  const commands = useCanvasCommandsContext();

  const getBlockById = useCallback(
    (id: string) => data.blocksById[id],
    [data.blocksById]
  );

  const onNodeClick = useCallback(
    (evt: React.MouseEvent, node: ReactFlowNode) => {
      evt.preventDefault();
      evt.stopPropagation();
      // 순수한 노드 선택만 처리 - 포커싱과 에디터 열기는 제거
      sel.setNodeSelection([node.id]);
    },
    [sel]
  );

  const onEdgeClick = useCallback(
    (_evt: React.MouseEvent, edge: ReactFlowEdge) => {
      sel.selectEdge(edge.id as string);
    },
    [sel]
  );

  const onPaneClick = useCallback(() => {
    // 순수한 도메인 로직: 선택 해제만 처리
    sel.setNodeSelection([]);
    sel.selectEdge(null);
  }, [sel]);

  const onConnect = useCallback<OnConnect>((_connection: Connection) => {
    // TODO: integrate connect command when implemented
  }, []);

  const onNodeDragStart = useCallback(() => {}, []);

  const onNodeDragStop = useCallback(
    async (_evt: React.MouseEvent, node: ReactFlowNode) => {
      const pos = node?.position;
      if (!pos) return;

      // 좌표 검증
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
        console.warn("Invalid node position:", pos);
        return;
      }
      // 드래그 종료 시 서버 액션 호출 (단일 진입점)
      const result = await commands.updateNodePosition(node.id, pos);
      if (!result.ok) {
        console.error("Failed to update node position:", result.error);
        // TODO: 사용자에게 에러 알림 (토스트 등)
      }
    },
    [commands]
  );

  const onNodeDoubleClick = useCallback(
    (_evt: React.MouseEvent, node: ReactFlowNode) => {
      // 순수한 노드 선택만 처리 - 포커싱과 에디터 열기는 제거
      sel.setNodeSelection([node.id]);
    },
    [sel]
  );

  const onEdgeDoubleClick = useCallback(
    (_evt: React.MouseEvent, _edge: ReactFlowEdge) => {},
    []
  );

  const onNodesDelete = useCallback(
    async (nodes: ReactFlowNode[]) => {
      // Delete selected nodes
      for (const node of nodes) {
        const result = await commands.deleteBlock(node.id);
        if (!result.ok) {
          console.error("Failed to delete block:", result.error);
        }
      }
    },
    [commands]
  );
  const onEdgesDelete = useCallback((_edges: ReactFlowEdge[]) => {}, []);
  const onConnectStart = useCallback(() => {}, []);
  const onConnectEnd = useCallback(() => {}, []);

  const onNodeDimensionsChange = useCallback(
    (changes: any[]) => {
      const sizeUpdates: { id: string; width: number; height: number }[] = [];
      for (const ch of changes || []) {
        if (ch?.type !== "dimensions" || !ch?.dimensions) continue;
        const w = (ch as any).dimensions?.width;
        const h = (ch as any).dimensions?.height;
        const resizing = (ch as any).resizing as boolean | undefined;
        if (resizing !== false) continue; // persist at end of resize
        if (typeof w === "number" && typeof h === "number") {
          sizeUpdates.push({
            id: ch.id,
            width: Math.round(w),
            height: Math.round(h),
          });
        }
      }
      if (sizeUpdates.length === 0) return;
      sizeUpdates.forEach(({ id, width, height }) => {
        const blk = getBlockById(id);
        if (!blk) return;
        const md: any = blk.metadata || {};
        const ui = { ...(md.node_ui || {}) } as any;
        const prev =
          (ui.size as { width?: number; height?: number } | undefined) || {};
        if (prev.width === width && prev.height === height) return;
        ui.size = { width, height };
        data.upsertBlock({ ...blk, metadata: { ...md, node_ui: ui } } as any);
      });
    },
    [getBlockById, data.upsertBlock]
  );

  const onNodeDataChange = useCallback(
    (changes: any[]) => {
      const dataUpdates: { id: string; data: Record<string, unknown> }[] = [];
      for (const ch of changes || []) {
        if (ch?.type === "data" && ch?.data) {
          dataUpdates.push({ id: ch.id, data: ch.data });
        } else if (ch?.type === "replace" && (ch as any).item?.data) {
          dataUpdates.push({ id: ch.id, data: (ch as any).item.data });
        }
      }
      if (dataUpdates.length === 0) return;
      dataUpdates.forEach(({ id, data: d }) => {
        const blk = getBlockById(id);
        if (!blk) return;
        const md: any = blk.metadata || {};
        const ui = { ...(md.node_ui || {}) } as any;
        const next: any = { ...blk };
        if (typeof (d as any).color === "string") ui.color = (d as any).color;
        if (typeof (d as any).shape === "string") ui.shape = (d as any).shape;
        if (typeof (d as any).fontSize === "string")
          ui.fontSize = (d as any).fontSize;
        if (typeof (d as any).weight === "string")
          ui.weight = (d as any).weight;
        if (typeof (d as any).label === "string") {
          const lbl = (d as any).label as string;
          next.name = lbl;
          (md as any).label = lbl;
        }
        data.upsertBlock({ ...next, metadata: { ...md, node_ui: ui } } as any);
      });
    },
    [getBlockById, data.upsertBlock]
  );

  const _onNodesChange = useCallback(
    async (changes: any[]) => {
      // Handle position changes (드래그 제외 - onNodeDragStop에서 처리)
      const posUpdates: { id: string; x: number; y: number }[] = [];
      for (const ch of changes || []) {
        if (ch?.type === "position") {
          const dragging = (ch as any).dragging as boolean | undefined;
          // 드래그 중이거나 드래그 종료 시에는 처리하지 않음 (onNodeDragStop에서 처리)
          if (dragging !== undefined) continue;

          const pos = (ch as any).position as
            | { x?: number; y?: number }
            | undefined;
          if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
            // 좌표 검증
            if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
              posUpdates.push({ id: ch.id, x: pos.x, y: pos.y });
            } else {
              console.warn("Invalid position coordinates:", pos);
            }
          }
        }
      }

      if (posUpdates.length > 0) {
        // 드래그가 아닌 다른 position 변경에 대한 배치 업데이트
        const result = await commands.updateNodePositions(posUpdates);
        if (!result.ok) {
          console.error("Failed to update node positions:", result.error);
          // TODO: 사용자에게 에러 알림 (토스트 등)
        }
      }

      // Handle other changes
      onNodeDimensionsChange(changes);
      onNodeDataChange(changes);
    },
    [commands, onNodeDimensionsChange, onNodeDataChange]
  );

  const result: UseReactFlowHandlerResult = useMemo(
    () => ({
      _onNodesChange,
      onNodeDimensionsChange,
      onNodeDataChange,
      onEdgesChange: (_: any) => {},
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
    }),
    [
      _onNodesChange,
      onNodeDimensionsChange,
      onNodeDataChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onNodeDragStart,
      onNodeDragStop,
      onNodeDoubleClick,
      onEdgeDoubleClick,
      onNodesDelete,
      onEdgesDelete,
      onConnectStart,
      onConnectEnd,
    ]
  );

  return result;
}
