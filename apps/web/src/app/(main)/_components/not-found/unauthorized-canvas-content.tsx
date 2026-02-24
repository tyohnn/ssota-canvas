/**
 * Unauthorized Canvas Content
 *
 * 404 not-found-canvas-content와 동일한 구조, 빨간색(primary) 스타일 전용
 * 권한 없음 / 인증 만료 시 표시
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

// 401 Unauthorized 육각형 노드 (RED/primary)
const UnauthorizedHexagonNode = memo(function UnauthorizedHexagonNode({
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

  const colorMap = {
    fill: isDark ? '#7f1d1d' : '#fee2e2', // red-900 / red-100
    stroke: '#ef4444', // red-500
    text: isDark ? '#fca5a5' : '#991b1b', // red-300 / red-800
  };

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
          '--glow-color': getGlowColor(ColorToken.RED),
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible transition-all duration-300"
          style={
            {
              filter: [
                'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
                ((isHovered && !selected) || selected) &&
                  'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
                ((isHovered && !selected) || selected) &&
                  `drop-shadow(0 0 20px ${getGlowColor(ColorToken.RED)})`,
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
            401
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
            Unauthorized
          </div>
        </div>
      </div>
    </div>
  );
});

const NODE_TYPES: NodeTypes = {
  'unauthorized-hexagon': UnauthorizedHexagonNode,
};

interface UnauthorizedCanvasContentProps {
  nodes: Node[];
}

function UnauthorizedCanvasInner({ nodes }: UnauthorizedCanvasContentProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reactFlow = useReactFlow();

  const [internalNodes, setNodes] = useNodesState(nodes);

  const hexagonBlockCenter = useMemo(() => {
    const block = nodes.find(node => node.id === 'unauthorized-hexagon');
    if (!block) return { x: 0, y: 0 };
    return {
      x: block.position.x + (block.width || 280) / 2,
      y: block.position.y + (block.height || 180) / 2,
    };
  }, [nodes]);

  useEffect(() => {
    setMounted(true);
    setNodes(nodes);

    if (reactFlow) {
      reactFlow.setCenter(hexagonBlockCenter.x, hexagonBlockCenter.y, {
        zoom: 0.85,
        duration: 0,
      });
    }
  }, [nodes, setNodes, reactFlow, hexagonBlockCenter]);

  const defaultViewport = useMemo(
    () => ({ x: 0, y: 0, zoom: 0.85 }),
    []
  );

  if (!mounted) {
    return <div className="h-full w-full bg-background" />;
  }

  return (
    <>
      <style jsx global>{`
        /* Override xyflow dark mode: use theme background via --xy-background-color */
        .unauthorized-canvas.react-flow,
        .unauthorized-canvas.react-flow.dark {
          --xy-background-color-default: var(--background) !important;
          --xy-background-color: var(--background) !important;
          background-color: var(--background) !important;
        }

        .unauthorized-canvas .react-flow__background {
          background-color: var(--background) !important;
        }

        .unauthorized-canvas .react-flow__pane {
          background-color: transparent !important;
        }

        .unauthorized-canvas .react-flow__node.selected,
        .unauthorized-canvas .react-flow__node.selectable:focus,
        .unauthorized-canvas .react-flow__node.selectable:focus-visible {
          outline: none !important;
        }

        .dark .unauthorized-canvas .react-flow__background-pattern {
          stroke: rgba(255, 255, 255, 0.05) !important;
        }

        .unauthorized-canvas .react-flow__background-pattern {
          stroke: rgba(0, 0, 0, 0.08) !important;
        }

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
        className="unauthorized-canvas h-full w-full"
        style={{ backgroundColor: 'var(--background)' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
      </ReactFlow>
    </>
  );
}

export function UnauthorizedCanvasContent({ nodes }: UnauthorizedCanvasContentProps) {
  return (
    <ReactFlowProvider>
      <UnauthorizedCanvasInner nodes={nodes} />
    </ReactFlowProvider>
  );
}
