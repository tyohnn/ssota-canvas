"use client";

import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface AccessesEdgeProps {
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
    label?: string;
    relationship_type?: string;
  };
}

export const AccessesEdge: React.FC<AccessesEdgeProps> = ({
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
}) => {
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
      <defs>
        <marker
          id="arrowhead-accesses"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd="url(#arrowhead-accesses)"
        style={{
          ...style,
          stroke: "#8b5cf6", // 보라색
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div className="bg-purple-100 border border-purple-200 rounded px-2 py-1 shadow-sm">
            <span className="text-purple-700">{data?.label || "accesses"}</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default AccessesEdge;
