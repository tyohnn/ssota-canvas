"use client";

import React, { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: any;
  targetPosition?: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: any;
  selected?: boolean;
}

export const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
  }: CustomEdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const edgeColor = selected ? "#3b82f6" : "#6b7280";
    const strokeWidth = selected ? 3 : 2;

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd="url(#arrowhead)"
          style={{
            ...style,
            stroke: edgeColor,
            strokeWidth,
          }}
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="4"
            refX="5"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={edgeColor} />
          </marker>
        </defs>
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            {data?.label && (
              <div className="bg-white px-2 py-1 rounded border shadow-sm">
                {data.label}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

CustomEdge.displayName = "CustomEdge";
