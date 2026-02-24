/**
 * Not Found Canvas Content
 *
 * ReactFlow를 사용하는 실제 캔버스 컴포넌트
 * SSR을 피하기 위해 dynamic import로 로드됨
 */

'use client';

import { memo, useEffect, useMemo, useState } from 'react';

import { useTheme } from 'next-themes';

import {
  Background,
  type Node,
  type NodeProps,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@workspace/ui/lib/utils';

import { ColorToken, getGlowColor } from '@/domains/block-management/shared/types/style-tokens.types';

// 404 육각형 노드 컴포넌트 (ShapeBlock 디자인 참고)
const NotFoundHexagonNode = memo(function NotFoundHexagonNode({
  width = 280,
  height = 180,
  selected = false,
}: NodeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ShapeBlock과 동일한 색상 매핑 (BLUE)
  const colorMap = {
    fill: isDark ? '#1e3a5f' : '#dbeafe', // blue-900 / blue-100
    stroke: '#3b82f6', // blue-500
    text: isDark ? '#93c5fd' : '#1e40af', // blue-300 / blue-800
  };

  // 육각형 포인트 계산 (ShapeBlock과 동일)
  const hexW = width / 4;
  const hexagonPoints = `${hexW},0 ${width - hexW},0 ${width},${height / 2} ${width - hexW},${height} ${hexW},${height} 0,${height / 2}`;

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-lg transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      )}
      style={
        {
          '--glow-color': getGlowColor(ColorToken.BLUE),
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* SVG 육각형 - ShapeBlock과 동일한 스타일 */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible transition-all duration-300"
          style={
            {
              filter: [
                // 기본 그림자
                'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
                // 호버/선택 시 그림자 강화
                ((isHovered && !selected) || selected) &&
                  'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
                // 호버/선택 시 글로우
                ((isHovered && !selected) || selected) &&
                  `drop-shadow(0 0 20px ${getGlowColor(ColorToken.BLUE)})`,
              ]
                .filter(Boolean)
                .join(' '),
            } as React.CSSProperties
          }
          preserveAspectRatio="none"
        >
          <polygon
            points={hexagonPoints}
            fill={colorMap.fill}
            stroke={colorMap.stroke}
            strokeWidth={2}
            className="animate-pulse-slow"
          />
        </svg>

        {/* 텍스트 오버레이 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
          <div
            className="font-bold text-center"
            style={{
              fontSize: '48px',
              fontWeight: '700',
              fontFamily: 'var(--font-sans)',
              color: colorMap.stroke,
              lineHeight: '1.2',
            }}
          >
            404
          </div>
          <div
            className="text-center mt-2"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)',
              color: colorMap.text,
            }}
          >
            Page Not Found
          </div>
        </div>
      </div>
    </div>
  );
});

// 노드 타입 정의
const NODE_TYPES: NodeTypes = {
  'not-found-hexagon': NotFoundHexagonNode,
};

interface NotFoundCanvasContentProps {
  nodes: Node[];
}

function NotFoundCanvasInner({ nodes }: NotFoundCanvasContentProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reactFlow = useReactFlow();

  // 노드 상태 관리
  const [internalNodes, setNodes] = useNodesState(nodes);

  // 404 블록 중심 계산
  const notFoundBlockCenter = useMemo(() => {
    const notFoundBlock = nodes.find(node => node.id === 'not-found-hexagon');
    if (!notFoundBlock) return { x: 0, y: 0 };
    return {
      x: notFoundBlock.position.x + (notFoundBlock.width || 280) / 2,
      y: notFoundBlock.position.y + (notFoundBlock.height || 180) / 2,
    };
  }, [nodes]);

  // 마운트 후 노드 업데이트 및 뷰포트 중앙 정렬
  useEffect(() => {
    setMounted(true);
    setNodes(nodes);

    // 404 블록 중심을 화면 중심에 맞추기
    if (reactFlow) {
      reactFlow.setCenter(notFoundBlockCenter.x, notFoundBlockCenter.y, {
        zoom: 0.85,
        duration: 0, // 즉시 적용
      });
    }
  }, [nodes, setNodes, reactFlow, notFoundBlockCenter]);

  // 뷰포트 설정 (초기값, useEffect에서 실제로 조정됨)
  const defaultViewport = useMemo(
    () => ({
      x: 0,
      y: 0,
      zoom: 0.85,
    }),
    []
  );

  if (!mounted) {
    return <div className="h-full w-full bg-background" />;
  }

  return (
    <>
      {/* React Flow 스타일 오버라이드 */}
      <style jsx global>{`
        /* Override xyflow dark mode: use theme background via --xy-background-color */
        .react-flow,
        .react-flow.dark {
          --xy-background-color-default: var(--background) !important;
          --xy-background-color: var(--background) !important;
          background-color: var(--background) !important;
        }

        .react-flow__background {
          background-color: var(--background) !important;
        }

        .react-flow__pane {
          background-color: transparent !important;
        }

        .react-flow__node.selected,
        .react-flow__node.selectable:focus,
        .react-flow__node.selectable:focus-visible {
          outline: none !important;
        }

        .dark .react-flow__background-pattern {
          stroke: rgba(255, 255, 255, 0.05) !important;
        }

        .react-flow__background-pattern {
          stroke: rgba(0, 0, 0, 0.08) !important;
        }

        /* 펄스 애니메이션 */
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>

      <ReactFlow
        nodes={internalNodes}
        edges={[]}
        nodeTypes={NODE_TYPES}
        defaultViewport={defaultViewport}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        // 모든 인터랙션 비활성화
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
        preventScrolling={false}
        minZoom={0.1}
        maxZoom={2}
        className="bg-muted/30 h-full w-full"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
      </ReactFlow>
    </>
  );
}

// Provider로 감싸서 export
export function NotFoundCanvasContent({ nodes }: NotFoundCanvasContentProps) {
  return (
    <ReactFlowProvider>
      <NotFoundCanvasInner nodes={nodes} />
    </ReactFlowProvider>
  );
}
