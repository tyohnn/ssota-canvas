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
import { CustomEdge } from '@/domains/canvas-management/frontend/components/edge/custom-edge';
import { CanvasModeProvider } from '@/domains/canvas-management/frontend/contexts/canvas-mode-context';
import { Button } from '@workspace/ui/components/ui/button';
import {
  toReactFlowNodeFromCanvasView,
  toReactFlowEdgeFromCanvasView,
  type CustomNodeType,
} from '@/domains/canvas-management/frontend/acl/react-flow.acl';
import { PublishedPageViewDTO } from '../../shared/dtos';

interface PublishedPageViewerProps {
  publishToken: string;
  initialData: PublishedPageViewDTO | null;
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
  initialData,
  onCopyRequested,
}: PublishedPageViewerProps) {
  const { copyLinkToClipboard } = useShare();
  const [isCopied, setIsCopied] = useState(false);
  const [isCopyPressed, setIsCopyPressed] = useState(false);

  const data = initialData;

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

  const nodes = useMemo<CustomNodeType[]>(() => {
    if (
      !data ||
      !data.organizationId ||
      !data.workspaceId
    ) {
      return [];
    }

    return data.blocks.map(block =>
      toReactFlowNodeFromCanvasView(block as any, {
        pageId: data.pageId,
        orgId: data.organizationId!,
        workspaceId: data.workspaceId!,
      })
    );
  }, [data]);

  const edges = useMemo<Edge[]>(() => {
    if (!data?.edges) return [];
    return data.edges.map(edge =>
      toReactFlowEdgeFromCanvasView(edge as any)
    );
  }, [data]);

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="h-screen w-full bg-background relative">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
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
      <div className="h-full">
        <ReactFlowProvider>
          <CanvasModeProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
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
                hasNodes={nodes.length > 0}
              />
              <Background />
            </ReactFlow>
          </CanvasModeProvider>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
