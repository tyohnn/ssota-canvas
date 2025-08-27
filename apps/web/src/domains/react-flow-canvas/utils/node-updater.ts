import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

/**
 * React Flow 노드 업데이트 유틸리티 함수들
 */

// 기본 노드 데이터 업데이트 함수
export const updateNodeData = (
  nodes: any[],
  nodeId: string,
  dataUpdate: any
) => {
  return nodes.map((n) =>
    n.id === nodeId
      ? { ...n, data: { ...n.data, ...dataUpdate } }
      : n
  );
};

// 블록 메타데이터 업데이트 함수
export const updateNodeBlockMetadata = (
  nodes: any[],
  nodeId: string,
  metadataUpdate: any
) => {
  return nodes.map((n) =>
    n.id === nodeId
      ? {
          ...n,
          data: {
            ...n.data,
            block: {
              ...(n.data.block as any),
              metadata: {
                ...(n.data.block as any)?.metadata,
                ...metadataUpdate,
              },
            },
          },
        }
      : n
  );
};

// 노드 UI 메타데이터 업데이트 함수
export const updateNodeUIMetadata = (
  nodes: any[],
  nodeId: string,
  uiUpdate: any
) => {
  return nodes.map((n) =>
    n.id === nodeId
      ? {
          ...n,
          data: {
            ...n.data,
            block: {
              ...(n.data.block as any),
              metadata: {
                ...(n.data.block as any)?.metadata,
                node_ui: {
                  ...(n.data.block as any)?.metadata?.node_ui,
                  ...uiUpdate,
                },
              },
            },
          },
        }
      : n
  );
};

// 노드 속성 업데이트 함수 (dragging, selected 등)
export const updateNodeProperty = (
  nodes: any[],
  nodeId: string,
  propertyUpdate: any
) => {
  return nodes.map((n) =>
    n.id === nodeId ? { ...n, ...propertyUpdate } : n
  );
};

// 노드 선택 상태 일괄 업데이트 함수
export const updateNodesSelection = (
  nodes: any[],
  selectedNodeIds: string[]
) => {
  return nodes.map((n) => ({
    ...n,
    selected: selectedNodeIds.includes(n.id),
  }));
};

/**
 * React Flow 노드 업데이트 훅
 */
export function useNodeUpdater() {
  const { setNodes } = useReactFlow();

  // 기본 노드 데이터 업데이트
  const updateNodeDataAsync = useCallback(
    (nodeId: string, dataUpdate: any) => {
      setNodes((nodes) => updateNodeData(nodes, nodeId, dataUpdate));
    },
    [setNodes]
  );

  // 블록 메타데이터 업데이트
  const updateNodeBlockMetadataAsync = useCallback(
    (nodeId: string, metadataUpdate: any) => {
      setNodes((nodes) => updateNodeBlockMetadata(nodes, nodeId, metadataUpdate));
    },
    [setNodes]
  );

  // 노드 UI 메타데이터 업데이트
  const updateNodeUIMetadataAsync = useCallback(
    (nodeId: string, uiUpdate: any) => {
      setNodes((nodes) => updateNodeUIMetadata(nodes, nodeId, uiUpdate));
    },
    [setNodes]
  );

  // 노드 속성 업데이트
  const updateNodePropertyAsync = useCallback(
    (nodeId: string, propertyUpdate: any) => {
      setNodes((nodes) => updateNodeProperty(nodes, nodeId, propertyUpdate));
    },
    [setNodes]
  );

  return {
    updateNodeData: updateNodeDataAsync,
    updateNodeBlockMetadata: updateNodeBlockMetadataAsync,
    updateNodeUIMetadata: updateNodeUIMetadataAsync,
    updateNodeProperty: updateNodePropertyAsync,
  };
}

/**
 * 특정 노드 타입을 위한 전용 업데이트 훅
 */
export function useShapeNodeUpdater() {
  const { updateNodeUIMetadata } = useNodeUpdater();

  const updateShapeNodeColor = useCallback(
    (nodeId: string, color: string) => {
      updateNodeUIMetadata(nodeId, { color });
    },
    [updateNodeUIMetadata]
  );

  const updateShapeNodeShape = useCallback(
    (nodeId: string, shape: string) => {
      updateNodeUIMetadata(nodeId, { shape });
    },
    [updateNodeUIMetadata]
  );

  const updateShapeNodeFontSize = useCallback(
    (nodeId: string, fontSize: string) => {
      updateNodeUIMetadata(nodeId, { fontSize });
    },
    [updateNodeUIMetadata]
  );

  const updateShapeNodeSize = useCallback(
    (nodeId: string, size: { width: number; height: number }) => {
      updateNodeUIMetadata(nodeId, { size });
    },
    [updateNodeUIMetadata]
  );

  return {
    updateColor: updateShapeNodeColor,
    updateShape: updateShapeNodeShape,
    updateFontSize: updateShapeNodeFontSize,
    updateSize: updateShapeNodeSize,
  };
}

/**
 * BasicTextNode 전용 업데이트 훅
 */
export function useBasicTextNodeUpdater() {
  const { updateNodeUIMetadata, updateNodeData } = useNodeUpdater();

  const updateBasicTextNodeColor = useCallback(
    (nodeId: string, color: string) => {
      updateNodeUIMetadata(nodeId, { color });
    },
    [updateNodeUIMetadata]
  );

  const updateBasicTextNodeFontSize = useCallback(
    (nodeId: string, fontSize: string) => {
      updateNodeUIMetadata(nodeId, { fontSize });
    },
    [updateNodeUIMetadata]
  );

  const updateBasicTextNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      updateNodeData(nodeId, { label });
    },
    [updateNodeData]
  );

  const updateBasicTextNodeSize = useCallback(
    (nodeId: string, size: { width: number; height: number }) => {
      updateNodeUIMetadata(nodeId, { size });
    },
    [updateNodeUIMetadata]
  );

  return {
    updateColor: updateBasicTextNodeColor,
    updateFontSize: updateBasicTextNodeFontSize,
    updateLabel: updateBasicTextNodeLabel,
    updateSize: updateBasicTextNodeSize,
  };
}
