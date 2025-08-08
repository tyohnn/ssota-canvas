"use client";

import React, { memo } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";

interface StartBlockData extends Record<string, unknown> {
  label: string;
  slug: string;
  description?: string;
}

export const StartBlock = memo(
  ({ data, selected }: NodeProps<Node<StartBlockData>>) => {
    const { label, slug, description } = data as StartBlockData;

    return (
      <div
        className={`relative ${selected ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}
      >
        {/* 시작 노드는 타겟 핸들이 없음 (진입점이 없기 때문) */}

        <div className="w-48 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-full shadow-md p-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">▶</span>
            </div>
            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-sm font-semibold text-emerald-900 truncate">
                {label}
              </h3>
              <p className="text-xs text-emerald-600 truncate">{slug}</p>
            </div>
          </div>
          {description && (
            <p className="text-xs text-emerald-700 text-center mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* 시작 노드는 오른쪽에만 출력 핸들 */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-3 h-3 bg-emerald-500"
        />
      </div>
    );
  }
);

StartBlock.displayName = "StartBlock";
