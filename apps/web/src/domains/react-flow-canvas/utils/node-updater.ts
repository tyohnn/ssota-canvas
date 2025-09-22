import { type Node } from "@xyflow/react";

/**
 * React Flow 노드 업데이트 유틸리티 함수들
 */

// 기본 노드 데이터 업데이트 함수
export const updateNodeData = (
  nodes: Node[],
  nodeId: string,
  dataUpdate: any
): Node[] => {
  return nodes.map((n) =>
    n.id === nodeId
      ? { ...n, data: { ...n.data, ...dataUpdate } }
      : n
  );
};

// 블록 메타데이터 업데이트 함수
export const updateNodeBlockMetadata = (
  nodes: Node[],
  nodeId: string,
  metadataUpdate: any
): Node[] => {
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
  nodes: Node[],
  nodeId: string,
  uiUpdate: any
): Node[] => {
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
  nodes: Node[],
  nodeId: string,
  propertyUpdate: any
): Node[] => {
  return nodes.map((n) =>
    n.id === nodeId ? { ...n, ...propertyUpdate } : n
  );
};

export const updateNodeLabel = (
  nodes: Node[],
  nodeId: string,
  label: string
): Node[] => {
  return updateNodeProperty(nodes, nodeId, { label });
};

// 노드 선택 상태 일괄 업데이트 함수
export const updateNodesSelection = (
  nodes: Node[],
  selectedNodeIds: string[]
): Node[] => {
  return nodes.map((n) => ({
    ...n,
    selected: selectedNodeIds.includes(n.id),
  }));
};
