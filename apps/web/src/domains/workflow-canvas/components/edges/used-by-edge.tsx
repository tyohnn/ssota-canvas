"use client";

import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface UsedByEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: any;
  targetPosition?: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    relationship_type?: string;
    usage_context?: string;
  };
}

export function UsedByEdge({
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
}: UsedByEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: "#8b5cf6", // Purple color for used_by edges
          strokeWidth: 2,
          strokeDasharray: "5,5", // Dashed line
        }}
      />
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
          <div className="bg-purple-100 border border-purple-300 rounded px-2 py-1 shadow-sm">
            <span className="text-purple-700 font-medium text-xs">
              {data?.relationship_type || "used_by"}
            </span>
            {data?.usage_context && (
              <div className="text-purple-500 text-xs">
                {data.usage_context}
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
