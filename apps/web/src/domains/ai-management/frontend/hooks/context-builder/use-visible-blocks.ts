'use client';

import { useCallback, useMemo } from 'react';
import { useReactFlow, useStore, type Node, type Edge } from '@xyflow/react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * Visible block metadata (excludes content).
 * blockMountId: canvas/selection reference; blockId: for content tools (read, etc.)
 */
export interface VisibleBlockMeta {
  blockMountId: string;
  blockId?: string;
  blockType: string;
  title: string;
  /** Block mount IDs this block points to (outgoing edges: this = source) */
  connectedTo?: string[];
  /** Block mount IDs that point to this block (incoming edges: this = target) */
  connectedFrom?: string[];
}

/** Max number of visible blocks to include in context (zoom-out cap) */
const MAX_VISIBLE_BLOCKS_IN_CONTEXT = 20;

/**
 * Flow-space visible rectangle from viewport transform.
 * containerWidth/Height = the React Flow pane size (the actual canvas area between header, sidebars, chat).
 * Screen coords: screen = flow * zoom + (x, y) => flow = (screen - (x,y)) / zoom.
 */
function getFlowVisibleRect(
  viewport: { x: number; y: number; zoom: number },
  containerWidth: number,
  containerHeight: number
) {
  const zoom = viewport.zoom;
  return {
    left: -viewport.x / zoom,
    top: -viewport.y / zoom,
    width: containerWidth / zoom,
    height: containerHeight / zoom,
  };
}

/** Viewport center in flow space */
function getFlowViewportCenter(
  viewport: { x: number; y: number; zoom: number },
  containerWidth: number,
  containerHeight: number
) {
  const zoom = viewport.zoom;
  return {
    centerX: -viewport.x / zoom + containerWidth / zoom / 2,
    centerY: -viewport.y / zoom + containerHeight / zoom / 2,
  };
}

/** Squared distance from node center to viewport center (avoids sqrt for sort) */
function nodeDistanceSqToCenter(
  node: Node,
  centerX: number,
  centerY: number
): number {
  const w = node.measured?.width ?? node.width ?? 200;
  const h = node.measured?.height ?? node.height ?? 150;
  const nodeCenterX = node.position.x + w / 2;
  const nodeCenterY = node.position.y + h / 2;
  const dx = nodeCenterX - centerX;
  const dy = nodeCenterY - centerY;
  return dx * dx + dy * dy;
}

/** Check if node rect (position + size) intersects the given flow-space rect */
function nodeIntersectsRect(
  node: Node,
  rect: { left: number; top: number; width: number; height: number }
): boolean {
  const w = node.measured?.width ?? node.width ?? 200;
  const h = node.measured?.height ?? node.height ?? 150;
  const nx = node.position.x;
  const ny = node.position.y;
  const nodeRight = nx + w;
  const nodeBottom = ny + h;
  const rectRight = rect.left + rect.width;
  const rectBottom = rect.top + rect.height;
  return !(nodeRight < rect.left || nx > rectRight || nodeBottom < rect.top || ny > rectBottom);
}

/**
 * Result of visible blocks with zoom-out cap: total in view vs. included in context.
 */
export interface VisibleBlocksResult {
  visibleBlocks: VisibleBlockMeta[];
  visibleBlocksTotalInView: number;
  visibleBlocksInContext: number;
}

/**
 * Calculate visible blocks based on viewport bounds (flow-space), capped by distance from center.
 * - 1) Nodes that intersect the viewport → visibleBlocksTotalInView.
 * - 2) Sort by distance to viewport center, take up to MAX_VISIBLE_BLOCKS_IN_CONTEXT → visibleBlocks, visibleBlocksInContext.
 */
export function calculateVisibleBlocks(
  nodes: Node[],
  edges: Edge[],
  viewport: { x: number; y: number; zoom: number },
  containerSize: { width: number; height: number }
): VisibleBlocksResult {
  const flowRect = getFlowVisibleRect(
    viewport,
    containerSize.width,
    containerSize.height
  );
  const { centerX, centerY } = getFlowViewportCenter(
    viewport,
    containerSize.width,
    containerSize.height
  );
  const inViewNodes = nodes.filter((node) => nodeIntersectsRect(node, flowRect));
  const totalInView = inViewNodes.length;

  const sorted = [...inViewNodes].sort(
    (a, b) =>
      nodeDistanceSqToCenter(a, centerX, centerY) -
      nodeDistanceSqToCenter(b, centerX, centerY)
  );
  const capped = sorted.slice(0, MAX_VISIBLE_BLOCKS_IN_CONTEXT);
  const visibleBlocks = capped.map((node) => nodeToVisibleMeta(node, edges));

  return {
    visibleBlocks,
    visibleBlocksTotalInView: totalInView,
    visibleBlocksInContext: visibleBlocks.length,
  };
}

/** Build VisibleBlockMeta from a node (for selected blocks or visible list). Deduplicates edge targets/sources (same node pair can have multiple edges). */
export function nodeToVisibleMeta(node: Node, edges: Edge[]): VisibleBlockMeta {
  const connectedTo = [...new Set(edges.filter((e) => e.source === node.id).map((e) => e.target))];
  const connectedFrom = [...new Set(edges.filter((e) => e.target === node.id).map((e) => e.source))];
  const data = node.data as BlockNodeData | undefined;
  return {
    blockMountId: node.id,
    blockId: data?.blockId,
    blockType: String(data?.blockType ?? 'unknown'),
    title: String(data?.title ?? 'Untitled'),
    connectedTo: connectedTo.length > 0 ? connectedTo : undefined,
    connectedFrom: connectedFrom.length > 0 ? connectedFrom : undefined,
  };
}

/**
 * Hook that provides the current visible blocks (viewport intersection in flow space, capped by center distance).
 * Returns a getter so callers can snapshot at send time (e.g. when collecting client context).
 */
export function useVisibleBlocks(): {
  getVisibleBlocks: () => VisibleBlocksResult;
} {
  const { getNodes, getEdges, getViewport } = useReactFlow();

  // Container = React Flow pane (canvas area only). Not the whole window — header, left sidebar, right chat are excluded.
  // Prefer store dimensions (set by React Flow when it measures its wrapper); fallback to .react-flow DOM element; last resort window.
  const storeDimensions = useStore((state) => ({
    width: (state as { width?: number }).width ?? 0,
    height: (state as { height?: number }).height ?? 0,
  }));
  const containerSize = useMemo(() => {
    let w = storeDimensions.width;
    let h = storeDimensions.height;
    if (
      typeof document !== 'undefined' &&
      (w <= 0 || h <= 0)
    ) {
      const pane = document.querySelector('.react-flow');
      if (pane && pane instanceof HTMLElement) {
        w = w <= 0 ? pane.clientWidth : w;
        h = h <= 0 ? pane.clientHeight : h;
      }
    }
    if (w <= 0 || h <= 0) {
      w = w <= 0 && typeof window !== 'undefined' ? window.innerWidth : w || 1920;
      h = h <= 0 && typeof window !== 'undefined' ? window.innerHeight : h || 1080;
    }
    return { width: w, height: h };
  }, [storeDimensions.width, storeDimensions.height]);

  const getVisibleBlocks = useCallback((): VisibleBlocksResult => {
    const nodes = getNodes();
    const edges = getEdges();
    const viewport = getViewport();
    return calculateVisibleBlocks(nodes, edges, viewport, containerSize);
  }, [getNodes, getEdges, getViewport, containerSize]);

  return { getVisibleBlocks };
}
