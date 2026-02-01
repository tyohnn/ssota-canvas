/**
 * Mock Custom Edge
 *
 * View-only custom edge for landing demo.
 * Uses EdgePath + markers from app's custom edge, no label/toolbar.
 */

"use client";

import React, { memo } from "react";
import type { EdgeProps } from "@xyflow/react";
import { useEdgePath } from "@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge/core/use-edge-path";
import { EdgePath } from "@/domains/canvas-management/frontend/components/react-flow-wrapper/components/custom-edge/components/edge-path";

function hasMarker(
  marker:
    | string
    | { type?: string; width?: number; height?: number; color?: string }
    | undefined
): boolean {
  if (!marker) return false;
  if (typeof marker === "object") return true;
  if (typeof marker === "string" && marker.startsWith("url(")) return true;
  return false;
}

interface MarkerProps {
  id: string;
  color: string;
}

function ArrowMarker({ id, color }: MarkerProps) {
  return (
    <marker
      id={id}
      markerWidth="20"
      markerHeight="20"
      viewBox="-10 -10 20 20"
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
      refX="0"
      refY="0"
    >
      <polyline
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        fill={color}
        points="-5,-4 0,0 -5,4 -5,-4"
      />
    </marker>
  );
}

function renderMarker(
  id: string,
  color: string,
  markerType?: string
): React.ReactElement {
  const actualType = markerType || "arrow";
  switch (actualType) {
    case "arrow":
    case "arrowclosed":
      return <ArrowMarker id={id} color={color} />;
    default:
      return <ArrowMarker id={id} color={color} />;
  }
}

function MockCustomEdgeComponent(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  } = props;

  const edgeShape = (props.data?.actualEdgeShape as string) || "smoothstep";
  const strokeColor = (style.stroke as string) || "#9ca3af";
  const strokeWidth = (style.strokeWidth as number) || 2;
  const markerEndType = props.data?.markerEndType as string | undefined;

  const { pathData, forceRenderKey } = useEdgePath({
    edgeId: id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    edgeShape,
  });

  const markerEndId = `${id}-marker-end`;
  const showMarkerEnd = hasMarker(markerEnd);

  return (
    <>
      <defs>
        {showMarkerEnd && renderMarker(markerEndId, strokeColor, markerEndType)}
      </defs>
      <EdgePath
        edgeId={id}
        path={pathData.edgePath}
        forceRenderKey={forceRenderKey}
        markerEnd={showMarkerEnd ? `url(#${markerEndId})` : undefined}
        markerStart={undefined}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
        }}
      />
    </>
  );
}

export const MockCustomEdge = memo(MockCustomEdgeComponent);
