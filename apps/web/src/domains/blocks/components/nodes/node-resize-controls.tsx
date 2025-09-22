"use client";

import { useCallback } from 'react';
import { NodeResizeControl, ResizeControlVariant, Node, useReactFlow } from '@xyflow/react';
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";

interface NodeResizeControlsProps {
  node: Node;
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
  resizeDirection?: "horizontal" | "vertical" | "both";
  variant?: ResizeControlVariant;
}

export function NodeResizeControls({
  node,
  selected,
  minWidth = 100,
  minHeight = 40,
  resizeDirection = "both",
  variant = ResizeControlVariant.Line
}: NodeResizeControlsProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  const shouldResize = useCallback((event: any, resizeParams: any) => {
    return true;
  }, []);

  // const handleResize = useCallback((event: any, resizeData: { width: number; height: number }) => {
  //   reactFlow.updateNode(node.id, {
  //     width: resizeData.width,
  //   });
    
  // }, [node.id, reactFlow]);

  // 너비만 DB에 저장, 높이는 TextContent가 전담
  const handleResizeEnd = useCallback(async (_event: any, resizeData: { width: number; height: number }) => {
    const result = await styleCommands.updateSize(node, {
      width: resizeData.width,
      // height: currentHeight,
    });
    if (!result.ok) {
      console.error("노드 사이즈 업데이트 실패:", result.error);
    }
  }, [node, styleCommands]);

  if (!selected) {
    return null;
  }

  return (
    <>
      {/* 좌측 리사이즈 컨트롤 */}
      <NodeResizeControl
        nodeId={node.id}
        position="left"
        variant={variant}
        resizeDirection="horizontal"
        minWidth={minWidth}
        shouldResize={shouldResize}
        onResizeEnd={handleResizeEnd}
        style={{ 
          width: '10px', // 더 넓은 영역
          border: 'none',
          background: 'transparent'
        }}
      />
      
      {/* 우측 리사이즈 컨트롤 */}
      <NodeResizeControl
        nodeId={node.id}
        position="right"
        variant={variant}
        resizeDirection="horizontal"
        minWidth={minWidth}
        shouldResize={shouldResize}
        onResizeEnd={handleResizeEnd}
        style={{ 
          width: '10px', // 더 넓은 영역
          border: 'none',
          background: 'transparent'
        }}
      />
    </>
  );
}
