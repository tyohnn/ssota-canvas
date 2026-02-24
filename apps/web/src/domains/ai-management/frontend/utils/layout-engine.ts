/**
 * Layout engine for organizeLayout tool.
 * - grid, stack: pure position calculation
 * - flow, tree, mindmap: ELKjs (elk.layered, elk.mrtree, elk.radial)
 */

import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api';

export interface LayoutNode {
  id: string;
  width: number;
  height: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
}

export type LayoutDirection = 'LR' | 'RL' | 'TB' | 'BT';

export interface LayoutOptions {
  columns?: number;
  direction?: LayoutDirection;
  spacing?: number;
  centerBlockMountId?: string;
}

const DEFAULT_SPACING = 60;

/**
 * Validates that all target nodes are on the same layer (same parentId).
 * Returns valid flag and the common parentId (undefined for root-level).
 */
export function validateSameLayer(
  nodes: Array<{ id: string; parentId?: string | null }>,
  targetIds: string[]
): {
  valid: boolean;
  filteredIds: string[];
  parentId: string | undefined;
} {
  const targetNodes = nodes.filter((n) => targetIds.includes(n.id));
  if (targetNodes.length === 0) {
    return { valid: false, filteredIds: [], parentId: undefined };
  }

  const parentIds = new Set(
    targetNodes.map((n) => (n.parentId == null ? '__root__' : n.parentId))
  );

  if (parentIds.size > 1) {
    return { valid: false, filteredIds: [], parentId: undefined };
  }

  const commonParent = [...parentIds][0]!;
  return {
    valid: true,
    filteredIds: targetIds,
    parentId: commonParent === '__root__' ? undefined : commonParent,
  };
}

/**
 * Grid layout: arrange nodes in rows and columns. Pure calculation.
 */
export function computeGridLayout(
  nodes: LayoutNode[],
  options: LayoutOptions = {}
): LayoutResult {
  const spacing = options.spacing ?? DEFAULT_SPACING;
  const columns =
    options.columns ?? Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const positions = new Map<string, { x: number; y: number }>();

  let maxHeightInRow = 0;
  let x = 0;
  let y = 0;

  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    if (col === 0) {
      x = 0;
      if (row > 0) {
        y += maxHeightInRow + spacing;
      }
      maxHeightInRow = node.height;
    } else {
      x += spacing;
    }

    positions.set(node.id, { x, y });
    x += node.width + spacing;
    maxHeightInRow = Math.max(maxHeightInRow, node.height);
  });

  return { positions };
}

/**
 * Stack layout: single row or column. Pure calculation.
 */
export function computeStackLayout(
  nodes: LayoutNode[],
  options: LayoutOptions = {}
): LayoutResult {
  const spacing = options.spacing ?? DEFAULT_SPACING;
  const direction = options.direction ?? 'TB';
  const positions = new Map<string, { x: number; y: number }>();

  const order =
    direction === 'BT' || direction === 'RL' ? [...nodes].reverse() : nodes;

  if (direction === 'TB' || direction === 'BT') {
    let y = 0;
    order.forEach((node) => {
      positions.set(node.id, { x: 0, y });
      y += node.height + spacing;
    });
  } else {
    let x = 0;
    order.forEach((node) => {
      positions.set(node.id, { x, y: 0 });
      x += node.width + spacing;
    });
  }

  return { positions };
}

/** Map our direction to ELK direction string */
function toElkDirection(direction: LayoutDirection): string {
  const map: Record<LayoutDirection, string> = {
    LR: 'RIGHT',
    RL: 'LEFT',
    TB: 'DOWN',
    BT: 'UP',
  };
  return map[direction] ?? 'RIGHT';
}

/**
 * Build ELK graph and run layout. Used by flow, tree, mindmap.
 */
async function runElkLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  algorithm: string,
  options: LayoutOptions
): Promise<LayoutResult> {
  const Elk = (await import('elkjs/lib/elk.bundled.js')).default;
  const elk = new Elk();

  const spacing = options.spacing ?? DEFAULT_SPACING;
  const direction = options.direction ?? (algorithm === 'radial' ? 'TB' : 'LR');

  const children: ElkNode[] = nodes.map((n) => ({
    id: n.id,
    width: n.width,
    height: n.height,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((e, i) => ({
    id: `e${i}`,
    sources: [e.source],
    targets: [e.target],
  }));

  const layoutOptions: Record<string, string> = {
    'elk.algorithm': algorithm,
    'elk.direction': toElkDirection(direction),
    'elk.spacing.nodeNode': String(spacing),
  };

  const graph: ElkNode = {
    id: 'root',
    layoutOptions,
    children,
    edges: elkEdges,
  };

  const laidOut = await elk.layout(graph);

  const positions = new Map<string, { x: number; y: number }>();
  (laidOut.children ?? []).forEach((child) => {
    if (child.id && child.x != null && child.y != null) {
      positions.set(child.id, { x: child.x, y: child.y });
    }
  });

  return { positions };
}

/**
 * Flow layout: directed graph following edges. ELK layered.
 */
export async function computeFlowLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions = {}
): Promise<LayoutResult> {
  return runElkLayout(nodes, edges, 'layered', options);
}

/**
 * Tree layout: hierarchical tree following edges. ELK mrtree.
 */
export async function computeTreeLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions = {}
): Promise<LayoutResult> {
  return runElkLayout(nodes, edges, 'mrtree', options);
}

/**
 * Mindmap layout: radial from center node. ELK radial.
 * Requires centerBlockMountId in options; that node is placed at center.
 */
export async function computeMindmapLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions = {}
): Promise<LayoutResult> {
  if (!options.centerBlockMountId) {
    return { positions: new Map() };
  }
  return runElkLayout(nodes, edges, 'radial', options);
}
