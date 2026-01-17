'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShare } from '../hooks/use-share';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CANVAS_NODE_TYPES } from '@/domains/canvas-management/frontend/config/node-types.config';
import { CustomEdge } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge';
import { CanvasModeProvider } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';
import { Button } from '@workspace/ui/components/ui/button';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

interface PublishedPageViewerProps {
  publishToken: string;
  title: string;
  icon?: string;
  initialNodes: CustomNodeType[];
  initialEdges: Edge[];
  onCopyRequested?: () => void;
}

interface ReadOnlyViewportControllerProps {
  hasNodes: boolean;
}

function ReadOnlyViewportController({
  hasNodes,
}: ReadOnlyViewportControllerProps) {
  const { fitView } = useReactFlow();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (hasNodes) {
      const timer = window.setTimeout(() => {
        fitView({ padding: 0.2, duration: 0 });
        hasInitializedRef.current = true;
      }, 80);
      return () => window.clearTimeout(timer);
    }
  }, [hasNodes, fitView]);

  return null;
}

export function PublishedPageViewer({
  publishToken,
  title,
  icon,
  initialNodes,
  initialEdges,
  onCopyRequested,
}: PublishedPageViewerProps) {
  const { copyLinkToClipboard } = useShare();
  const [isCopied, setIsCopied] = useState(false);
  const [isCopyPressed, setIsCopyPressed] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/p/${publishToken}`;
      await copyLinkToClipboard(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1200);
    } catch {
      setIsCopied(false);
    }
  };

  const nodeTypes = useMemo(() => CANVAS_NODE_TYPES, []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 bg-background z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold truncate max-w-[300px]">
            {title || 'Untitled'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className={`transition-shadow active:shadow-inner hover:bg-accent/60 hover:text-accent-foreground ${isCopied ? 'bg-accent text-accent-foreground shadow-sm' : ''}`}
          >
            {isCopied ? 'Link Copied' : 'Copy Link'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setIsCopyPressed(true);
              window.setTimeout(() => setIsCopyPressed(false), 150);
              onCopyRequested?.();
            }}
            className={`transition-shadow active:shadow-inner ${isCopyPressed ? 'bg-primary/90 text-primary-foreground shadow-sm' : ''
              }`}
          >
            Copy
          </Button>
        </div>
      </header>

      {/* Canvas Content */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <CanvasModeProvider>
            <ReactFlow
              nodes={initialNodes}
              edges={initialEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag
              panOnScroll
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              selectionOnDrag={false}
              minZoom={0.1}
              maxZoom={2}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              className="bg-muted/30"
            >
              <ReadOnlyViewportController
                hasNodes={initialNodes.length > 0}
              />
              <Background />
            </ReactFlow>
          </CanvasModeProvider>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
