"use client";

import { useCallback } from 'react';
import { NodeResizer, Node, useReactFlow } from '@xyflow/react';
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface FreeResizerControlProps {
  node: Node;
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
  borderColor?: string;
  bgColor?: string;
  disabled?: boolean;
}

export function FreeResizerControl({
  node,
  selected,
  minWidth = 80,
  minHeight = 40,
  borderColor = '#3b82f6',
  bgColor = 'transparent',
  disabled = false
}: FreeResizerControlProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  // 리사이즈 완료 시 호출 (DB 저장)
  const handleResizeEnd = useCallback(async (_event: any, resizeData: { width: number; height: number }) => {

    // DB에 크기 업데이트 저장
    const result = await styleCommands.updateSize(node, {
      width: resizeData.width,
      height: resizeData.height,
    });

    if (!result.ok) {
      console.error("노드 사이즈 업데이트 실패:", result.error);
      
      // 실패 시 원래 크기로 롤백
      reactFlow.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                width: node.width || 160,
                height: node.height || 64,
              }
            : n
        )
      );
    }
  }, [node, styleCommands, reactFlow]);

  // 선택되지 않았거나 비활성화된 경우 렌더링하지 않음
  if (!selected || disabled) {
    return null;
  }

  return (
    <NodeResizer
      minWidth={minWidth}
      minHeight={minHeight}
      onResizeEnd={handleResizeEnd}
      // 스타일링
      color={borderColor}
      // 리사이즈 핸들 스타일
      handleStyle={{
        width: '8px',
        height: '8px',
        background: bgColor,
        borderRadius: '50%',  
      }}
      lineStyle={{
        borderColor: borderColor,
        borderWidth: 2,
      }}
      // 리사이즈 방향 (가로/세로 모두)
      isVisible={selected}
      shouldResize={() => true}
    />
  );
}
