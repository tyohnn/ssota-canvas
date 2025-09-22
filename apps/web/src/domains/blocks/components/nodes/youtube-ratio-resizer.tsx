'use client';

import { useCallback, useMemo } from 'react';
import {
  NodeResizeControl,
  ResizeControlVariant,
  Node,
  useReactFlow,
} from '@xyflow/react';
import { useReactFlowCommandsContext } from '@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext';

interface YouTubeRatioResizerProps {
  node: Node;
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number; // 16:9 = 16/9 = 1.777...
}

export function YouTubeRatioResizer({
  node,
  selected,
  minWidth = 320,
  minHeight = 180,
  aspectRatio = 16 / 9, // YouTube 기본 비율
}: YouTubeRatioResizerProps) {
  const { styleCommands } = useReactFlowCommandsContext();
  const reactFlow = useReactFlow();

  // 현재 노드의 크기
  const currentWidth = node.width || minWidth;
  const currentHeight = node.height || minHeight;

  // 비율에 맞는 최소 크기 계산
  const minSize = useMemo(() => {
    if (aspectRatio > 1) {
      // 가로가 더 긴 경우 (16:9)
      return {
        width: minWidth,
        height: Math.max(minHeight, minWidth / aspectRatio),
      };
    } else {
      // 세로가 더 긴 경우 (9:16)
      return {
        width: Math.max(minWidth, minHeight * aspectRatio),
        height: minHeight,
      };
    }
  }, [minWidth, minHeight, aspectRatio]);

  const shouldResize = useCallback((event: any, resizeParams: any) => {
    return true;
  }, []);

  // 비율을 유지하면서 크기 조정
  const handleResize = useCallback(
    (event: any, resizeData: { width: number; height: number }) => {
      // 우측 하단에서만 조정하므로 width만 변경하고 height는 비율에 맞게 계산
      const newWidth = Math.max(minSize.width, resizeData.width);
      const newHeight = newWidth / aspectRatio;

      // React Flow 노드 즉시 업데이트 (optimistic update)
      reactFlow.setNodes(nodes =>
        nodes.map(n =>
          n.id === node.id ? { ...n, width: newWidth, height: newHeight } : n
        )
      );
    },
    [node.id, reactFlow, minSize.width, aspectRatio]
  );

  // 리사이즈 완료 시 DB에 저장
  const handleResizeEnd = useCallback(
    async (_event: any, resizeData: { width: number; height: number }) => {
      const newWidth = Math.max(minSize.width, resizeData.width);
      const newHeight = newWidth / aspectRatio;

      const result = await styleCommands.updateSize(node, {
        width: newWidth,
        height: newHeight,
      });

      if (!result.ok) {
        console.error('YouTube 노드 사이즈 업데이트 실패:', result.error);

        // 실패 시 원래 크기로 롤백
        reactFlow.setNodes(nodes =>
          nodes.map(n =>
            n.id === node.id
              ? { ...n, width: currentWidth, height: currentHeight }
              : n
          )
        );
      }
    },
    [
      node,
      styleCommands,
      reactFlow,
      minSize.width,
      aspectRatio,
      currentWidth,
      currentHeight,
    ]
  );

  if (!selected) {
    return null;
  }

  return (
    <>
      {/* 우측 하단 리사이즈 컨트롤만 표시 */}
      <NodeResizeControl
        nodeId={node.id}
        position="bottom-right"
        variant={ResizeControlVariant.Handle}
        shouldResize={shouldResize}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        style={{
          width: '12px',
          height: '12px',
          border: 'none',
          background: 'transparent',
          cursor: 'nw-resize',
        }}
      />
    </>
  );
}
