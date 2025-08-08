"use client";

import React, { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface ContainsEdgeProps {
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

export const ContainsEdge = memo(
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
  }: ContainsEdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const edgeColor = selected ? "#3b82f6" : "#8b5cf6"; // Purple
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
            <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200 shadow-sm text-xs">
              contains
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

ContainsEdge.displayName = "ContainsEdge";
