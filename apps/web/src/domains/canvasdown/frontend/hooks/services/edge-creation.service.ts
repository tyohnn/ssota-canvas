/**
 * Edge Creation Service
 *
 * Canvasdown 엣지를 SSOTA 엣지로 생성하는 서비스
 * ID 매핑을 통한 source/target 변환을 처리합니다.
 * createEdge 한 번에 라벨·스타일·마커를 전달합니다.
 *
 * Canvasdown의 React Flow adapter는 direction에 따라 sourceHandle과 targetHandle을 자동 설정합니다.
 */

import type { Edge } from '@xyflow/react';
import type { useCanvasEdgeLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-lifecycle';
import type { MarkerType } from '@/domains/canvas-management/shared/types/marker-type';
import { normalizeEdgeStyle } from '../utils/edge-style-normalizer';

export interface CreateEdgeParams {
  canvasdownEdge: Edge;
  nodeIdMap: Map<string, string>;
  edgeLifecycle: ReturnType<typeof useCanvasEdgeLifecycle>;
}

export interface CreateEdgeResult {
  success: boolean;
  error?: Error;
}

const SSOTA_MARKER_TYPES: MarkerType[] = [
  'none',
  'arrow',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open',
];

const SSOTA_EDGE_SHAPES = [
  'default',
  'straight',
  'step',
  'smoothstep',
  'simplebezier',
] as const;

type EdgeShapeValue = (typeof SSOTA_EDGE_SHAPES)[number];

/** Canvasdown shape 문자열을 SSOTA edge shape로 정규화 */
function normalizeShape(value: string | undefined | null): EdgeShapeValue | undefined {
  if (value == null || value === '') return undefined;
  const lower = value.toLowerCase().trim();
  return SSOTA_EDGE_SHAPES.includes(lower as EdgeShapeValue)
    ? (lower as EdgeShapeValue)
    : undefined;
}

/** Canvasdown 마커 문자열(arrowclosed 등)을 SSOTA MarkerType으로 정규화 */
function normalizeMarker(
  value: string | undefined | null
): MarkerType | undefined {
  if (value == null || value === '') return undefined;
  const lower = value.toLowerCase();
  if (lower === 'arrowclosed') return 'arrow';
  return SSOTA_MARKER_TYPES.includes(lower as MarkerType)
    ? (lower as MarkerType)
    : undefined;
}

type CanvasdownEdgeExt = Edge & {
  label?: string;
  data?: {
    label?: string;
    actualEdgeShape?: string;
    markerEndType?: string;
    markerStartType?: string;
    style?: { stroke?: string; strokeWidth?: number };
  };
  style?: { stroke?: string; strokeWidth?: number };
};

/**
 * Canvasdown 엣지를 SSOTA 엣지로 생성합니다.
 * 라벨·스타일·마커를 createEdge 한 번에 전달합니다.
 */
export async function createEdgeFromCanvasdown(
  params: CreateEdgeParams
): Promise<CreateEdgeResult> {
  const { canvasdownEdge, nodeIdMap, edgeLifecycle } = params;
  const e = canvasdownEdge as CanvasdownEdgeExt;

  const sourceBlockMountId = nodeIdMap.get(canvasdownEdge.source);
  const targetBlockMountId = nodeIdMap.get(canvasdownEdge.target);

  if (!sourceBlockMountId || !targetBlockMountId) {
    return {
      success: false,
      error: new Error(
        `Missing block mount IDs for edge: ${canvasdownEdge.source} -> ${canvasdownEdge.target}`
      ),
    };
  }

  const sourceHandle = canvasdownEdge.sourceHandle ?? null;
  const targetHandle = canvasdownEdge.targetHandle ?? null;

  const rawStyle = e.style ?? e.data?.style;
  const normalizedStyle = normalizeEdgeStyle(
    rawStyle ? { stroke: rawStyle.stroke, strokeWidth: rawStyle.strokeWidth } : undefined
  );
  const labelRaw = e.label ?? e.data?.label;
  const label =
    labelRaw != null && String(labelRaw).trim() !== ''
      ? String(labelRaw).trim()
      : undefined;
  const markerEnd =
    normalizeMarker(e.data?.markerEndType) ??
    (typeof e.markerEnd === 'object' && e.markerEnd != null && 'markerType' in e.markerEnd
      ? normalizeMarker(String((e.markerEnd as { markerType?: string }).markerType))
      : undefined);
  const markerStart =
    normalizeMarker(e.data?.markerStartType) ??
    (typeof e.markerStart === 'object' && e.markerStart != null && 'markerType' in e.markerStart
      ? normalizeMarker(String((e.markerStart as { markerType?: string }).markerType))
      : undefined);
  const shape = normalizeShape(e.data?.actualEdgeShape);

  try {
    await edgeLifecycle.createEdge({
      sourceBlockMountId,
      targetBlockMountId,
      sourceHandle,
      targetHandle,
      ...(label != null && { label }),
      ...(normalizedStyle && { style: normalizedStyle }),
      ...(shape != null && { shape }),
      ...(markerEnd != null && { markerEnd }),
      ...(markerStart != null && { markerStart }),
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[EdgeCreationService] Error creating edge:`, error);

    return {
      success: false,
      error: error instanceof Error ? error : new Error(errorMessage),
    };
  }
}

/**
 * 여러 엣지를 순차 생성합니다.
 * 병렬 생성 시 각 createEdge의 onMutate가 동일한 getEdges() 결과를 보고 setEdges를 호출해
 * 서로 덮어쓰므로, 순차 실행으로 이전 엣지가 반영된 뒤 다음 엣지를 추가합니다.
 *
 * @param params - 엣지 생성 파라미터 배열
 * @returns 생성 결과 배열
 */
export async function createEdgesFromCanvasdown(
  params: CreateEdgeParams[]
): Promise<CreateEdgeResult[]> {
  const results: CreateEdgeResult[] = [];
  for (const param of params) {
    const result = await createEdgeFromCanvasdown(param);
    results.push(result);
  }
  return results;
}
