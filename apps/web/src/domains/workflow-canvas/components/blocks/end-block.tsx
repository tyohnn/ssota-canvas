"use client";

import React, { memo } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";

interface EndBlockData extends Record<string, unknown> {
  label: string;
  slug: string;
  outcome?: "success" | "failure" | "neutral";
  description?: string;
}

export const EndBlock = memo(
  ({ data, selected }: NodeProps<Node<EndBlockData>>) => {
    const {
      label,
      slug,
      outcome = "neutral",
      description,
    } = data as EndBlockData;

    // outcome에 따른 색상 결정
    const getColorClasses = () => {
      switch (outcome) {
        case "success":
          return {
            ring: "ring-green-500",
            bg: "from-green-50 to-green-100",
            border: "border-green-200",
            text: "text-green-900",
            subtext: "text-green-600",
            description: "text-green-700",
            iconBg: "bg-green-500",
          };
        case "failure":
          return {
            ring: "ring-red-500",
            bg: "from-red-50 to-red-100",
            border: "border-red-200",
            text: "text-red-900",
            subtext: "text-red-600",
            description: "text-red-700",
            iconBg: "bg-red-500",
          };
        default:
          return {
            ring: "ring-gray-500",
            bg: "from-gray-50 to-gray-100",
            border: "border-gray-200",
            text: "text-gray-900",
            subtext: "text-gray-600",
            description: "text-gray-700",
            iconBg: "bg-gray-500",
          };
      }
    };

    const colors = getColorClasses();

    return (
      <div
        className={`relative ${selected ? `ring-2 ${colors.ring} ring-offset-2` : ""}`}
      >
        {/* 종료 노드는 왼쪽에서만 입력 받음 */}
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3 h-3 ${colors.iconBg}`}
        />

        <div
          className={`w-48 bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-full shadow-md p-3`}
        >
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-6 h-6 ${colors.iconBg} rounded-full flex items-center justify-center`}
            >
              <span className="text-white text-xs font-bold">
                {outcome === "success"
                  ? "✓"
                  : outcome === "failure"
                    ? "✗"
                    : "●"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-center">
              <h3 className={`text-sm font-semibold ${colors.text} truncate`}>
                {label}
              </h3>
              <p className={`text-xs ${colors.subtext} truncate`}>{slug}</p>
            </div>
          </div>
          {description && (
            <p
              className={`text-xs ${colors.description} text-center mt-1 line-clamp-2`}
            >
              {description}
            </p>
          )}
        </div>

        {/* 종료 노드는 출력 핸들이 없음 (종료점이기 때문) */}
      </div>
    );
  }
);

EndBlock.displayName = "EndBlock";
