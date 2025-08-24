"use client";

import { useCallback } from "react";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import type { Block } from "@/db/schema";
import { setValue } from "./object-path";

export function useBlockPropertyUpdate(block: Block | null | undefined) {
  const commands = useCanvasCommandsContext();

  const updateMetadata = useCallback(
    async (path: string[], value: unknown) => {
      if (!block) return;

      const nextMetadata = { ...(block.metadata || {}) };
      setValue(nextMetadata as Record<string, any>, path, value);

      const result = await commands.updateBlock(block.id, {
        metadata: nextMetadata as any,
      });

      if (!result.ok) {
        console.error("Failed to update block:", result.error);
      }
    },
    [block, commands]
  );

  return { updateMetadata };
}
