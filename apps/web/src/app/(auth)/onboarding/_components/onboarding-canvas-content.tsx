/**
 * Onboarding Canvas Content
 *
 * ReactFlow를 사용하는 온보딩 캔버스 컴포넌트
 * 각 스텝마다 다른 노드를 표시
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
import { ChevronDown } from 'lucide-react';

const TYPEWRITER_INTERVAL_MS = 90;

// Shape Block Node - For greeting (typewriter effect when greeting updates)
const OnboardingShapeNode = memo(function OnboardingShapeNode({
  data,
  width = 320,
  height = 180,
}: NodeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const nodeData = data as { title?: string };
  const targetText = nodeData?.title ?? '';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter: animate displayed text towards target (one character at a time when target grows)
  useEffect(() => {
    if (targetText.length <= displayedText.length) {
      setDisplayedText(targetText);
      return;
    }
    const id = setInterval(() => {
      setDisplayedText(prev => {
        const next = targetText.slice(0, prev.length + 1);
        return next;
      });
    }, TYPEWRITER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [targetText]);

  const colorMap = {
    fill: isDark ? '#1e3a5f' : '#dbeafe',
    stroke: '#3b82f6',
    text: isDark ? '#93c5fd' : '#1e40af',
  };

  const hexW = width / 4;
  const hexagonPoints = `${hexW},0 ${width - hexW},0 ${width},${height / 2} ${width - hexW},${height} ${hexW},${height} 0,${height / 2}`;

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-lg transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      )}
      style={
        {
          '--glow-color': getGlowColor(ColorToken.BLUE),
        } as React.CSSProperties
      }
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
                'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
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

        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
          <div
            className="text-center"
            style={{
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: 'var(--font-sans)',
              color: colorMap.text,
              lineHeight: '1.4',
              maxWidth: '280px',
            }}
          >
            {targetText === '' ? '...' : displayedText}
          </div>
        </div>
      </div>
    </div>
  );
});

// Org Switcher Mock Node - For organization step
const OnboardingOrgNode = memo(function OnboardingOrgNode({
  data,
  width = 420,
  height = 280,
}: NodeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const nodeData = data as { title?: string };
  const displayInitial = nodeData?.title?.charAt(0)?.toUpperCase() || 'O';

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-lg transition-all duration-500 ease-out',
        'border-2 border-primary/20 bg-card shadow-2xl',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      )}
      style={
        {
          '--glow-color': getGlowColor(ColorToken.BLUE),
          filter: `drop-shadow(0 0 30px ${getGlowColor(ColorToken.BLUE)})`,
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col items-center justify-center w-full h-full p-8">
        {/* Mock Org Switcher UI - Magnified */}
        <div className="w-full max-w-[320px] space-y-4">
          <div className="text-muted-foreground text-sm font-medium mb-2">
            Organization
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-sidebar hover:bg-sidebar/80 transition-colors cursor-pointer">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-md">
              <span className="text-lg font-semibold">
                {displayInitial}
              </span>
            </div>
            <span className="truncate text-lg font-medium flex-1">
              {nodeData?.title || 'Organization'}
            </span>
            <ChevronDown className="opacity-50" size={20} />
          </div>
          <div className="text-muted-foreground/60 text-xs text-center mt-4">
            This will be your organization
          </div>
        </div>
      </div>
    </div>
  );
});

// 노드 타입 정의
const NODE_TYPES: NodeTypes = {
  'onboarding-shape': OnboardingShapeNode,
  'onboarding-org': OnboardingOrgNode,
};

interface OnboardingCanvasContentProps {
  nodes: Node[];
}

function OnboardingCanvasInner({ nodes }: OnboardingCanvasContentProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reactFlow = useReactFlow();

  const [internalNodes, setNodes] = useNodesState(nodes);

  const centerPoint = useMemo(() => {
    const firstNode = nodes[0];
    if (!firstNode) return { x: 0, y: 0 };
    return {
      x: firstNode.position.x + (firstNode.width || 320) / 2,
      y: firstNode.position.y + (firstNode.height || 180) / 2,
    };
  }, [nodes]);

  useEffect(() => {
    setMounted(true);
    setNodes(nodes);

    if (reactFlow) {
      reactFlow.setCenter(centerPoint.x, centerPoint.y, {
        zoom: 0.9,
        duration: 300,
      });
    }
  }, [nodes, setNodes, reactFlow, centerPoint]);

  const defaultViewport = useMemo(
    () => ({
      x: 0,
      y: 0,
      zoom: 0.9,
    }),
    []
  );

  if (!mounted) {
    return <div className="h-full w-full bg-background" />;
  }

  return (
    <>
      <style jsx global>{`
        .react-flow {
          background-color: hsl(var(--background)) !important;
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
        className="bg-muted/30 h-full w-full"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
      </ReactFlow>
    </>
  );
}

export function OnboardingCanvasContent({ nodes }: OnboardingCanvasContentProps) {
  return (
    <ReactFlowProvider>
      <OnboardingCanvasInner nodes={nodes} />
    </ReactFlowProvider>
  );
}
