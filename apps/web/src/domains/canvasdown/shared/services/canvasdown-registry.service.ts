/**
 * Canvasdown Registry Service
 *
 * SSOTA 블록 타입 및 엣지 타입을 Canvasdown에 등록하는 서비스
 * Visual Summary에서 사용할 블록 타입들(shape, markdown, group)과 엣지 마커를 등록합니다.
 *
 * 0.4.0: zone 기능(isGroup: true), propertySchema
 * 0.6.0: edge marker 지원 (markerEnd, markerStart), edgePropertySchema
 *
 * Core는 프레임워크 독립적이므로 React 컴포넌트(component)는 등록하지 않습니다.
 * 노드 렌더링용 nodeTypes는 별도로 정의해 useCanvasdown과 ReactFlow에 전달합니다.
 */

import {
  CanvasdownCore,
  type BlockTypeDefinition,
} from '@ssota-labs/canvasdown';
import {
  BlockType,
  BLOCK_TYPE_SIZES,
} from '@/domains/block-management/shared/types/block-types';
import {
  ShapeType,
  type BorderStyle,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

/** 엣지 두께 허용 값 (EdgeStyle MIN/MAX와 동기화: 1–3) */
export const EDGE_STROKE_WIDTHS = [1, 2, 3] as const;
export type EdgeStrokeWidth = (typeof EDGE_STROKE_WIDTHS)[number];

/**
 * SSOTA 블록 타입을 Canvasdown Core에 등록
 *
 * 블록 타입 정의만 등록합니다. React Flow 노드 컴포넌트는 등록하지 않으며,
 * nodeTypes는 별도로 정의해 useCanvasdown(dsl, { core, nodeTypes })와
 * ReactFlow의 nodeTypes prop에 전달합니다.
 *
 * @param core - CanvasdownCore 인스턴스
 */
export function registerSSOTABlockTypes(core: CanvasdownCore): void {
  // Shape 블록 등록
  const shapeConfig: BlockTypeDefinition<{
    shapeType: ShapeType;
    color: ColorToken;
    borderStyle: BorderStyle;
  }> = {
    name: 'shape',
    defaultProperties: {
      shapeType: ShapeType.RECTANGLE,
      color: ColorToken.BLUE,
      borderStyle: 'solid',
    },
    defaultSize: BLOCK_TYPE_SIZES[BlockType.SHAPE],
    propertySchema: {
      shapeType: {
        type: 'enum',
        enum: Object.values(ShapeType),
        description: 'Shape type for the block',
      },
      color: {
        type: 'enum',
        enum: Object.values(ColorToken),
        description: 'Color token for the block',
      },
      borderStyle: {
        type: 'enum',
        enum: ['solid', 'dashed', 'dotted'] as const,
        description: 'Border style for the shape',
      },
    },
  };
  core.registerBlockType(shapeConfig);

  // Markdown 블록 등록
  const markdownConfig: BlockTypeDefinition<{
    color: ColorToken;
  }> = {
    name: 'markdown',
    defaultProperties: {
      color: ColorToken.GRAY,
    },
    defaultSize: BLOCK_TYPE_SIZES[BlockType.MARKDOWN],
    propertySchema: {
      color: {
        type: 'enum',
        enum: Object.values(ColorToken),
        description: 'Color token for the markdown block',
      },
    },
  };
  core.registerBlockType(markdownConfig);

  // Zone 블록 등록 (Group과 동일하지만 별도 타입으로 등록)
  // LLM이 'zone' 타입을 사용할 수 있도록 별도로 등록
  const zoneConfig = {
    name: 'zone',
    isGroup: true, // Mark as group type for zone support
    defaultProperties: {
      title: 'New Zone',
      color: ColorToken.GRAY,
      direction: 'TB' as const, // Default direction for children
      padding: 20,
    },
    defaultSize: BLOCK_TYPE_SIZES[BlockType.GROUP],
    propertySchema: {
      title: {
        type: 'string' as const,
        description: 'Title/label for the zone',
      },
      color: {
        type: 'enum' as const,
        enum: Object.values(ColorToken),
        description: 'Color token for the zone',
      }
    },
  };
  core.registerBlockType(zoneConfig);
}

/**
 * SSOTA Custom Edge에서 지원하는 마커 타입
 * CustomEdge 컴포넌트의 renderMarker와 동기화
 */
export const SSOTA_EDGE_MARKERS = [
  'arrow',
  'arrowclosed',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open',
] as const;

export type SSOTAEdgeMarker = (typeof SSOTA_EDGE_MARKERS)[number];

/**
 * SSOTA 엣지 타입을 Canvasdown에 등록
 *
 * 0.6.0: markerEnd, markerStart를 edgePropertySchema로 등록하여
 * DSL에서 nodeA -> nodeB { markerEnd: "arrowclosed" } 형태로 사용 가능
 *
 * @param core - CanvasdownCore 인스턴스
 */
/** Edge type config for 0.6.0+ (edgePropertySchema for markerEnd/markerStart, stroke/strokeWidth) */
interface EdgeTypeConfigWithMarkers {
  name: string;
  defaultShape: string;
  defaultStyle: { stroke: string; strokeWidth: number };
  defaultData?: { markerEnd?: string };
  edgePropertySchema?: {
    markerEnd?: { type: 'enum'; enum: readonly string[]; description: string };
    markerStart?: { type: 'enum'; enum: readonly string[]; description: string };
    stroke?: { type: 'enum'; enum: readonly string[]; description: string };
    strokeWidth?: { type: 'enum'; enum: readonly number[]; description: string };
  };
}

export function registerSSOTAEdgeTypes(core: CanvasdownCore): void {
  if (typeof core.registerEdgeType !== 'function') {
    return;
  }

  const config: EdgeTypeConfigWithMarkers = {
    name: 'default',
    defaultShape: 'default',
    defaultStyle: { stroke: '#b1b1b7', strokeWidth: 2 },
    defaultData: {
      markerEnd: 'arrowclosed',
    },
    edgePropertySchema: {
      markerEnd: {
        type: 'enum',
        enum: [...SSOTA_EDGE_MARKERS],
        description: 'Marker at the end of the edge (target side)',
      },
      markerStart: {
        type: 'enum',
        enum: [...SSOTA_EDGE_MARKERS],
        description: 'Marker at the start of the edge (source side)',
      },
      stroke: {
        type: 'enum',
        enum: Object.values(ColorToken),
        description: 'Edge stroke color (color token)',
      },
      strokeWidth: {
        type: 'enum',
        enum: [...EDGE_STROKE_WIDTHS],
        description: 'Edge stroke width (1-3, same as EdgeStyle)',
      },
    },
  };

  (core.registerEdgeType as (config: EdgeTypeConfigWithMarkers) => void)(config);
}
