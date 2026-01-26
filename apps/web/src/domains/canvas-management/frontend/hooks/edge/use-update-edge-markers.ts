'use client';

import { useMutation } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';

import { updateEdgeMarkersAction } from '@/domains/canvas-management/actions/edge/update-edge-markers.action';
import { UpdateEdgeMarkerRequestSchema } from '@/domains/canvas-management/shared/dtos/requests';
import type { EdgeData } from '@/domains/canvas-management/shared/types/common.types';
import type { MarkerType } from '@/domains/canvas-management/shared/types/marker-type';
import { isFailure } from '@/lib';

export type ReactFlowDependencies = {
  getEdges: () => Edge<EdgeData>[];
  setEdges: (edges: Edge<EdgeData>[]) => void;
};

export type UseUpdateEdgeMarkersParams = {
  reactFlow: ReactFlowDependencies;
};

export type UpdateEdgeMarkerInput = {
  edgeId: string;
  marker: 'start' | 'end';
  value: MarkerType;
};

export type UseUpdateEdgeMarkersResult = {
  updateEdgeMarker: (input: UpdateEdgeMarkerInput) => Promise<boolean>;
  isUpdating: boolean;
};

/**
 * 엣지 마커(화살표) 업데이트 도메인 훅 — start/end 중 하나만 변경
 * - marker: 'start' | 'end', value: MarkerType (none | arrow | arrow-open | circle | diamond 등)
 * - Optimistic: data.markerEndType/markerStartType 및 markerEnd/markerStart URL 설정 (CustomEdge 호환)
 */
export function useUpdateEdgeMarkers(
  params: UseUpdateEdgeMarkersParams
): UseUpdateEdgeMarkersResult {
  const { reactFlow } = params;
  const { getEdges, setEdges } = reactFlow;

  const mutation = useMutation({
    mutationFn: async (input: UpdateEdgeMarkerInput) => {
      const parseResult = UpdateEdgeMarkerRequestSchema.safeParse(input);
      if (!parseResult.success) {
        const first = parseResult.error.issues[0];
        throw new Error(first?.message ?? 'Invalid edge marker update data');
      }
      const result = await updateEdgeMarkersAction(parseResult.data);
      if (isFailure(result)) throw new Error(result.error);
      return result.data;
    },

    onMutate: async ({ edgeId, marker, value }) => {
      const currentEdges = getEdges();
      const edge = currentEdges.find(e => e.id === edgeId);
      if (!edge) throw new Error('Edge not found');

      const prev = edge.data as EdgeData | undefined;

      setEdges(
        currentEdges.map(e =>
          e.id === edgeId
            ? {
                ...e,
                data: {
                  ...e.data,
                  edgeId: e.data?.edgeId ?? edgeId, // Ensure edgeId is always string
                  markerEndType:
                    marker === 'end' ? value : (prev?.markerEndType ?? 'arrow'),
                  markerStartType:
                    marker === 'start' ? value : prev?.markerStartType,
                } as EdgeData,
                markerEnd:
                  marker === 'end'
                    ? value === 'none'
                      ? undefined
                      : `url(#${edgeId}-marker-end)`
                    : e.markerEnd,
                markerStart:
                  marker === 'start'
                    ? value === 'none'
                      ? undefined
                      : `url(#${edgeId}-marker-start)`
                    : e.markerStart,
              }
            : e
        )
      );
      return { previousEdges: currentEdges };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousEdges) setEdges(ctx.previousEdges);
    },
  });

  return {
    updateEdgeMarker: async (input: UpdateEdgeMarkerInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(input);
        return true;
      } catch {
        return false;
      }
    },
    isUpdating: mutation.isPending,
  };
}
