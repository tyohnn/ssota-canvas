"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  PAGE_BLOCK_COLOR_TOKENS,
  PAGE_BLOCK_ICONS,
  getBlockColorClasses,
  isAgentMetadata,
} from "@/domains/workflow-canvas/policy";
import { BlockMetadata, BlockType } from "@workspace/domain-contracts";

interface AgentBlockData extends Record<string, unknown> {
  label: string;
  metadata: BlockMetadata;
  slug?: string; // Legacy fallback
}

/**
 * Agent Block Component
 */
export const AgentBlock = memo(
  ({ data, selected }: NodeProps<Node<AgentBlockData>>) => {
    const { label, metadata, slug: legacySlug } = data as AgentBlockData;

    // Get agent-specific metadata using type guards
    const agentMetadata = isAgentMetadata(metadata) ? metadata : null;
    const name = agentMetadata?.name || label || "Untitled Agent";
    const slug = agentMetadata?.slug || legacySlug || "";
    const description = agentMetadata?.description || "";

    // Extract agent-specific metadata
    const role = agentMetadata?.role || "";
    const style = agentMetadata?.style || "";
    const identity = agentMetadata?.identity || "";
    const focus = agentMetadata?.focus || "";
    const corePrinciples = agentMetadata?.core_principles || "";

    const colorToken = PAGE_BLOCK_COLOR_TOKENS[BlockType.AGENT];
    const colors = getBlockColorClasses(colorToken);
    const AgentIcon = PAGE_BLOCK_ICONS[BlockType.AGENT];

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
              <AgentIcon className="h-3 w-3 text-white" />
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

          {/* Agent specific content */}
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

            {role && (
              <div>
                <p className="text-xs text-gray-700 font-medium">Role:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{role}</p>
              </div>
            )}

            {focus && (
              <div>
                <p className="text-xs text-gray-700 font-medium">Focus:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{focus}</p>
              </div>
            )}

            {style && (
              <div>
                <p className="text-xs text-gray-700 font-medium">Style:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{style}</p>
              </div>
            )}

            {identity && (
              <div>
                <p className="text-xs text-gray-700 font-medium">Identity:</p>
                <p className="text-xs text-gray-600 line-clamp-2">{identity}</p>
              </div>
            )}

            {corePrinciples && (
              <div>
                <p className="text-xs text-gray-700 font-medium">
                  Core Principles:
                </p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {corePrinciples}
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

AgentBlock.displayName = "AgentBlock";
