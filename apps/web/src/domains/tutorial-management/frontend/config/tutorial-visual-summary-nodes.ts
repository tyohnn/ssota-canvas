/**
 * Tutorial Visual Summary Nodes & Edges
 *
 * Builds ReactFlow nodes and edges for the "visual summary result" step
 * using the same argument map data as the landing Structure demo.
 */

import type { Edge, Node } from '@xyflow/react';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { ShapeType } from '@/domains/block-management/shared/value-objects/block-properties';
import type { ShapeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import type { MarkdownBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import {
  ARGUMENT_MAP_EDGES,
  ARGUMENT_MAP_LAYOUT_RELATIVE,
  ARGUMENT_MAP_NODES,
} from '@/app/(main)/_components/landing-v2/sections/demo-sections/tabs/structure/mock-argument-map-data';

/** Anchor = top-left position where the argument map group starts (e.g. 100px right of YouTube block). */
export interface VisualSummaryAnchor {
  x: number;
  y: number;
}

const TUTORIAL_PAGE_ID = 'tutorial';

const TUTORIAL_VS_PREFIX = 'tutorial-vs-';
const MOCK_PROFILE = {
  id: 'tutorial',
  email: 'tutorial@demo',
  name: 'Tutorial',
  avatarUrl: '',
};

const COLOR_MAP: Record<string, ColorToken> = {
  red: ColorToken.RED,
  orange: ColorToken.ORANGE,
  amber: ColorToken.AMBER,
  green: ColorToken.GREEN,
  blue: ColorToken.BLUE,
  purple: ColorToken.PURPLE,
  pink: ColorToken.PINK,
  gray: ColorToken.GRAY,
};

function shapeNodeDataToBlockData(nodeData: (typeof ARGUMENT_MAP_NODES)[number]) {
  if (nodeData.type === 'markdown') {
    const props: MarkdownBlockProperties = { color: ColorToken.GRAY };
    return {
      blockId: nodeData.id,
      blockMountId: nodeData.id,
      blockType: BlockType.MARKDOWN,
      title: nodeData.title,
      viewMode: 'original' as const,
      properties: props,
      customProperties: [],
      content: nodeData.content,
      createdByProfile: MOCK_PROFILE,
    };
  }
  const shapeProps: ShapeBlockProperties = {
    shapeType: (nodeData.shapeType as ShapeType) ?? ShapeType.RECTANGLE,
    color: COLOR_MAP[nodeData.color ?? 'gray'] ?? ColorToken.GRAY,
    borderStyle: nodeData.borderStyle ?? 'solid',
  };
  return {
    blockId: nodeData.id,
    blockMountId: nodeData.id,
    blockType: BlockType.SHAPE,
    title: nodeData.title,
    viewMode: 'original' as const,
    properties: shapeProps,
    customProperties: [],
    createdByProfile: MOCK_PROFILE,
  };
}

/**
 * Returns nodes and edges for the tutorial visual summary (argument map).
 * Node ids are prefixed with TUTORIAL_VS_PREFIX so we can detect them in the canvas.
 * @param anchor - Top-left position of the argument map (e.g. YouTube block right edge + 100px).
 */
export function getTutorialVisualSummaryNodesAndEdges(
  anchor: VisualSummaryAnchor
): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = ARGUMENT_MAP_NODES.map((nodeData) => {
    const id = TUTORIAL_VS_PREFIX + nodeData.id;
    const rel = ARGUMENT_MAP_LAYOUT_RELATIVE[nodeData.id] ?? { x: 0, y: 0 };
    const position = {
      x: anchor.x + rel.x,
      y: anchor.y + rel.y,
    };
    const isMarkdown = nodeData.type === 'markdown';
    const size = isMarkdown
      ? BLOCK_TYPE_SIZES[BlockType.MARKDOWN]
      : { width: nodeData.shapeType === 'ellipse' ? 200 : nodeData.shapeType === 'diamond' ? 160 : 180, height: nodeData.shapeType === 'ellipse' ? 120 : nodeData.shapeType === 'diamond' ? 100 : 100 };
    const data = shapeNodeDataToBlockData(nodeData);
    return {
      id,
      type: nodeData.type === 'markdown' ? BlockType.MARKDOWN : BlockType.SHAPE,
      position,
      data: { ...data, blockId: id, blockMountId: id },
      draggable: false,
      selectable: false,
      style: { width: size.width, height: size.height, overflow: 'visible' as const },
    } as Node;
  });

  const COLOR_HEX: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    amber: '#eab308',
    green: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    gray: '#9ca3af',
  };

  const edges: Edge[] = ARGUMENT_MAP_EDGES.map((e) => ({
    id: TUTORIAL_VS_PREFIX + e.id,
    source: TUTORIAL_VS_PREFIX + e.source,
    target: TUTORIAL_VS_PREFIX + e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'custom' as const,
    data: {
      edgeId: TUTORIAL_VS_PREFIX + e.id,
      actualEdgeShape: (e.shape as 'smoothstep') ?? 'smoothstep',
      pageId: TUTORIAL_PAGE_ID,
      markerEndType: 'arrowclosed',
    },
    label: e.label,
    style: {
      stroke: COLOR_HEX[e.stroke] ?? COLOR_HEX.gray,
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed' as const,
      width: 20,
      height: 20,
      color: COLOR_HEX[e.stroke] ?? COLOR_HEX.gray,
    },
  }));

  return { nodes, edges };
}

export function isTutorialVisualSummaryNodeId(id: string): boolean {
  return id.startsWith(TUTORIAL_VS_PREFIX);
}
