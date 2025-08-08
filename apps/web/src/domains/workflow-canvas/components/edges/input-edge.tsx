"use client";

import React, { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface InputEdgeProps {
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

export const InputEdge = memo(
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
  }: InputEdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const edgeColor = selected ? "#3b82f6" : "#ef4444"; // Red
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
            strokeDasharray: data?.strokeDasharray || "5,5", // 대시 스타일 적용
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
            <div className="bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 shadow-sm text-xs">
              input
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

InputEdge.displayName = "InputEdge";
