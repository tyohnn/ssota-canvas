"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  PageBlockType,
  getBlockColorClasses,
  isChecklistMetadata,
  type BlockMetadata,
} from "@/domains/workflow-canvas/policy";

interface ChecklistNodeData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
}

export const ChecklistBlock = memo(
  ({ data, selected }: NodeProps<Node<ChecklistNodeData>>) => {
    const { label, metadata, slug: legacySlug } = data as ChecklistNodeData;

    // Get checklist-specific metadata using type guards
    const checklistMetadata = isChecklistMetadata(metadata) ? metadata : null;
    const name = checklistMetadata?.name || label || "Untitled Checklist";
    const slug = checklistMetadata?.slug || legacySlug || "";
    const description = checklistMetadata?.description || "";

    // Extract checklist-specific metadata
    const instructions = checklistMetadata?.instructions || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[PageBlockType.CHECKLIST];
    const colors = getBlockColorClasses(colorToken);
    const ChecklistIcon = PAGE_BLOCK_ICONS[PageBlockType.CHECKLIST];

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
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={`w-3 h-3 ${colors.bg500}`}
        />

        <div
          className={`w-64 bg-gradient-to-br ${colors.gradientFrom50} ${colors.gradientTo100} border-2 ${colors.border200} rounded-lg shadow-md p-3`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-6 h-6 ${colors.bg500} rounded-full flex items-center justify-center`}
            >
              <ChecklistIcon className="h-3 w-3 text-white" />
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

          {/* Checklist specific content */}
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
      </div>
    );
  }
);

ChecklistBlock.displayName = "ChecklistBlock";
