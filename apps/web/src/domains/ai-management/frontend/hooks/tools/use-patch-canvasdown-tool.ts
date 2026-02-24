'use client';

import { useCallback } from 'react';
import type { AddToolOutput } from './use-render-canvasdown-tool';
import type { RenderCanvasdownFromContext } from './use-render-canvasdown-tool';

export interface UsePatchCanvasdownToolDeps {
  renderCanvasdownFromContext: RenderCanvasdownFromContext;
}

export function usePatchCanvasdownTool({
  renderCanvasdownFromContext,
}: UsePatchCanvasdownToolDeps) {
  return useCallback(
    async (addToolOutput: AddToolOutput, toolCallId: string, args: { dsl?: string }) => {
      try {
        const dsl = args.dsl as string;

        const result = await renderCanvasdownFromContext({
          canvasdown: dsl,
        });

        if (!result.success) {
          addToolOutput({
            tool: 'patchCanvasdown',
            toolCallId,
            state: 'output-error',
            errorText: result.errors.join(', '),
          });
          return;
        }

        addToolOutput({
          tool: 'patchCanvasdown',
          toolCallId,
          output: {
            success: true,
            message: `Patched ${result.blockIdMap.size} blocks`,
          },
        });
      } catch (error) {
        console.error('[usePatchCanvasdownTool] error:', error);
        addToolOutput({
          tool: 'patchCanvasdown',
          toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [renderCanvasdownFromContext]
  );
}
