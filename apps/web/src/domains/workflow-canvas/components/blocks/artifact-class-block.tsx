"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  getBlockColorClasses,
  isArtifactClassMetadata,
} from "@/domains/workflow-canvas/policy";
import { BlockMetadata, BlockType } from "@workspace/domain-contracts";

interface ArtifactClassBlockData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
}

export const ArtifactClassBlock = memo(
  ({ data, selected }: NodeProps<Node<ArtifactClassBlockData>>) => {
    const {
      label,
      metadata,
      slug: legacySlug,
    } = data as ArtifactClassBlockData;

    // Get artifact class-specific metadata using type guards
    const classMetadata = isArtifactClassMetadata(metadata) ? metadata : null;
    const name =
      classMetadata?.displayName || label || "Untitled Artifact Class";
    const slug = classMetadata?.identifier || legacySlug || "";
    const description = classMetadata?.description || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_CLASS];
    const colors = getBlockColorClasses(colorToken);
    const ArtifactClassIcon = PAGE_BLOCK_ICONS[BlockType.ARTIFACT_CLASS];

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
              <ArtifactClassIcon className="h-3 w-3 text-white" />
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

          {/* Artifact Class specific content */}
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

ArtifactClassBlock.displayName = "ArtifactClassBlock";
