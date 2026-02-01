"use client";

/**
 * Mock Group Block
 *
 * Structure 탭 전용 그룹 블록 (gray).
 * 자식 노드들을 포함하는 컨테이너.
 */

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { cn } from "@workspace/ui/lib/utils";
import { ColorToken, getGroupColorValues, getGlowColor } from "@/domains/block-management/shared/types/style-tokens.types";
import { Box } from "@/components/ui/box";

export interface MockGroupBlockData extends Record<string, unknown> {
  step?: number;
}

function MockGroupBlockComponent({ id, width, height, selected }: NodeProps) {
  const nodeWidth = typeof width === "number" ? width : 680;
  const nodeHeight = typeof height === "number" ? height : 620;

  const color = ColorToken.GRAY;
  const colors = getGroupColorValues(color);

  return (
    <Box
      className={cn(
        "w-full h-full flex flex-col rounded-lg",
        "transition-all duration-200 ease-out"
      )}
      style={
        {
          backgroundColor: colors.bg,
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: colors.border,
          boxShadow: selected
            ? `0 0 0 2px ${colors.border}, 0 0 8px ${getGlowColor(color)}`
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
        } as React.CSSProperties
      }
    >
      <Box className="flex-1 relative min-w-0 min-h-0" />
    </Box>
  );
}

export const MockGroupBlock = memo(MockGroupBlockComponent);
