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

interface AgentNodeData extends Record<string, unknown> {
  label: string;
  slug: string;
  persona?: string;
  role?: string;
  capabilities?: string[];
  tools?: string[];
}


/**
 * Agent Node Component
 */
export const AgentNode = memo(
  ({ data, selected }: NodeProps<Node<AgentNodeData>>) => {
    const { label, slug, persona, role, capabilities = [], tools = [] } = data as AgentNodeData;

    return (
      <div
        className={`relative ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-primary"
        />

        <Card className="w-64 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 bg-blue-500">
                <AvatarFallback className="text-white text-sm font-semibold">
                  {label.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold text-blue-900 truncate">
                  {label}
                </CardTitle>
                <p className="text-xs text-blue-600 truncate">{slug}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {persona && (
              <div className="mb-2">
                <p className="text-xs text-blue-700 line-clamp-2">{persona}</p>
              </div>
            )}

            {role && (
              <div className="mb-2">
                <p className="text-xs text-blue-600 font-medium">{role}</p>
              </div>
            )}

            {capabilities.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  Capabilities:
                </p>
                <div className="flex flex-wrap gap-1">
                  {capabilities.slice(0, 3).map((capability: string, index: number) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs px-1 py-0"
                    >
                      {capability}
                    </Badge>
                  ))}
                  {capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {tools.length > 0 && (
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">Tools:</p>
                <div className="flex flex-wrap gap-1">
                  {tools.slice(0, 2).map((tool: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs px-1 py-0"
                    >
                      {tool}
                    </Badge>
                  ))}
                  {tools.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{tools.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary"
        />
      </div>
    );
  }
);

AgentNode.displayName = "AgentNode";
