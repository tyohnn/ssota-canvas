"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  PageBlockType,
  getBlockColorClasses,
  isWorkflowMetadata,
  type BlockMetadata,
} from "@/domains/workflow-canvas/policy";

interface WorkflowBlockData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
}

export const WorkflowBlock = memo(
  ({ data, selected }: NodeProps<Node<WorkflowBlockData>>) => {
    const { label, metadata, slug: legacySlug } = data as WorkflowBlockData;

    // Get workflow-specific metadata using type guards
    const workflowMetadata = isWorkflowMetadata(metadata) ? metadata : null;
    const name = workflowMetadata?.name || label || "Untitled Workflow";
    const slug = workflowMetadata?.slug || legacySlug || "";
    const description = workflowMetadata?.description || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[PageBlockType.WORKFLOW];
    const colors = getBlockColorClasses(colorToken);
    const WorkflowIcon = PAGE_BLOCK_ICONS[PageBlockType.WORKFLOW];

    return (
      <div
        className={`relative ${selected ? `ring-2 ${colors.ring500} ring-offset-2` : ""}`}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={`w-3 h-3 ${colors.bg500}`}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={`w-3 h-3 ${colors.bg500}`}
        />

        <div
          className={`w-64 bg-gradient-to-br ${colors.gradientFrom50} ${colors.gradientTo100} border-2 ${colors.border200} rounded-lg shadow-md p-3`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-6 h-6 ${colors.bg500} rounded-full flex items-center justify-center`}
            >
              <WorkflowIcon className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold ${colors.text900} truncate`}
              >
                {name}
              </h3>
              <p className={`text-xs ${colors.text600} truncate`}>{slug}</p>
            </div>
          </div>

          {/* Workflow specific content */}
          {description && (
            <div>
              <p className="text-xs text-gray-700 font-medium">Description:</p>
              <p className="text-xs text-gray-600 line-clamp-3">
                {description}
              </p>
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={`w-3 h-3 ${colors.bg500}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={`w-3 h-3 ${colors.bg500}`}
        />
      </div>
    );
  }
);

WorkflowBlock.displayName = "WorkflowBlock";
