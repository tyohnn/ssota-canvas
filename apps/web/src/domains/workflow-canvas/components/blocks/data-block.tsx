"use client";

import React, { memo } from "react";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  getBlockColorClasses,
  isDataMetadata,
} from "@/domains/workflow-canvas/policy";
import { BlockMetadata, BlockType } from "@workspace/domain-contracts";

interface DataBlockData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
}

export const DataBlock = memo(
  ({ data, selected }: NodeProps<Node<DataBlockData>>) => {
    const { label, metadata, slug: legacySlug } = data as DataBlockData;

    // Get data-specific metadata using type guards
    const dataMetadata = isDataMetadata(metadata) ? metadata : null;
    const name = dataMetadata?.name || label || "Untitled Data";
    const slug = dataMetadata?.slug || legacySlug || "";
    const description = dataMetadata?.description || "";

    // Extract data-specific metadata
    const content = dataMetadata?.content || "";
    const file = dataMetadata?.file || "";
    const filetype = dataMetadata?.filetype || "";
    const filesize = dataMetadata?.filesize || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[BlockType.DATA];
    const colors = getBlockColorClasses(colorToken);
    const DataIcon = PAGE_BLOCK_ICONS[BlockType.DATA];

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
              <DataIcon className="h-3 w-3 text-white" />
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

          {/* Data specific content */}
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

            {file && (
              <div>
                <p className="text-xs text-gray-700 font-medium">File:</p>
                <p className="text-xs text-gray-600 line-clamp-1">{file}</p>
                {filetype && (
                  <p className="text-xs text-gray-500">Type: {filetype}</p>
                )}
                {filesize && (
                  <p className="text-xs text-gray-500">Size: {filesize}</p>
                )}
              </div>
            )}

            {content && !file && (
              <div>
                <p className="text-xs text-gray-700 font-medium">Content:</p>
                <p className="text-xs text-gray-600 line-clamp-3">{content}</p>
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

DataBlock.displayName = "DataBlock";
