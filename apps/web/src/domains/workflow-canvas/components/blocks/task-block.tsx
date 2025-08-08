"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  getBlockColorClasses,
  isTaskMetadata,
} from "@/domains/workflow-canvas/policy";
import { BlockMetadata, BlockType } from "@workspace/domain-contracts";

interface TaskBlockData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
  instructions?: string; // Legacy fallback
}

/**
 * Task Block Component
 */
export const TaskBlock = memo(
  ({ data, selected }: NodeProps<Node<TaskBlockData>>) => {
    const {
      label,
      metadata,
      slug: legacySlug,
      instructions: legacyInstructions,
    } = data as TaskBlockData;

    // Get task-specific metadata using type guards
    const taskMetadata = isTaskMetadata(metadata) ? metadata : null;
    const name = taskMetadata?.name || label || "Untitled Task";
    const slug = taskMetadata?.slug || legacySlug || "";
    const description = taskMetadata?.description || "";

    // Extract task-specific metadata
    const instructions = taskMetadata?.instructions || legacyInstructions || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[BlockType.TASK];
    const colors = getBlockColorClasses(colorToken);
    const TaskIcon = PAGE_BLOCK_ICONS[BlockType.TASK];

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
              <TaskIcon className="h-3 w-3 text-white" />
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

          {/* Task specific content */}
          <div className="space-y-2">
            {description && (
              <div>
                <p className="text-xs text-gray-700 font-medium">
                  Description:
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {description}
                </p>
              </div>
            )}

            {instructions && (
              <div>
                <p className="text-xs text-gray-700 font-medium">
                  Instructions:
                </p>
                <p className="text-xs text-gray-600 line-clamp-3">
                  {instructions}
                </p>
              </div>
            )}
          </div>
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
        <Handle
          type="source"
          position={Position.Left}
          id="left-output"
          className={`w-3 h-3 ${colors.bg500}`}
        />
      </div>
    );
  }
);

TaskBlock.displayName = "TaskBlock";
