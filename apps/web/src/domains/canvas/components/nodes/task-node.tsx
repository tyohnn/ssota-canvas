"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";

interface TaskNodeData extends Record<string, unknown> {
  label: string;
  slug: string;
  instructions?: string;
  variables?: Record<string, any>;
}


export const TaskNode = memo(({ data, selected }: NodeProps<Node<TaskNodeData>>) => {
  const { label, slug, instructions } = data as TaskNodeData;

  return (
    <div
      className={`relative ${selected ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500"
      />

      <div className="w-64 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-green-900 truncate">
              {label}
            </h3>
            <p className="text-xs text-green-600 truncate">{slug}</p>
          </div>
        </div>

        {instructions && (
          <p className="text-xs text-green-700 line-clamp-3">{instructions}</p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
});

TaskNode.displayName = "TaskNode";
