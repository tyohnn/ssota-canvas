"use client";

import React, { memo } from "react";

interface WorkflowNodeData {
  label: string;
  slug: string;
}

export const WorkflowNode = memo(({ data, selected }: any) => {
  const { label, slug } = data;

  return (
    <div
      className={`relative ${selected ? "ring-2 ring-orange-500 ring-offset-2" : ""}`}
    >
      <div className="w-64 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-orange-900 truncate">
              {label}
            </h3>
            <p className="text-xs text-orange-600 truncate">{slug}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";
