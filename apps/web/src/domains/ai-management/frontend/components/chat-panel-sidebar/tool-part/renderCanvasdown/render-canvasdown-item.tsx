'use client';

import { CheckIcon } from 'lucide-react';
import type { ToolCallPart } from '../../types';
import type { RenderCanvasdownToolOutput } from './types';

export interface RenderCanvasdownItemProps {
  part: ToolCallPart;
  partKey: string;
}

/**
 * One item per renderCanvasdown call. Shows "Rendering canvas…" when running,
 * "Added N blocks" (or error) when done.
 */
export function RenderCanvasdownItem({ part }: RenderCanvasdownItemProps) {
  const state = part.state;
  const output = part.output as RenderCanvasdownToolOutput | undefined;

  const isError = state === 'output-error';
  const isDone = state === 'output-available' && part.output != null;
  const isRunning = !isDone && !isError;

  const blockCount = output?.blockIdMap ? Object.keys(output.blockIdMap).length : 0;
  const statusLabel = isRunning ? 'Rendering canvas' : 'Added to canvas';

  if (isError) {
    return (
      <div className="text-muted-foreground text-sm border-muted border-l-2 pl-4">
        <span className="text-red-500">✗</span>{' '}
        <span className="text-red-500">{part.errorText ?? 'Tool failed.'}</span>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex w-full items-center gap-2 text-muted-foreground text-sm border-muted border-l-2 pl-4">
        <span className="animate-pulse">⏳</span>
        <span>{statusLabel} …</span>
      </div>
    );
  }

  if (!isDone) return null;

  return (
    <div className="text-muted-foreground text-sm border-muted border-l-2 pl-4">
      <div className="flex items-center gap-2">
        <CheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-500" />
        <span>
          {statusLabel}
          {blockCount > 0 ? ` (${blockCount} block${blockCount === 1 ? '' : 's'})` : ''}
        </span>
      </div>
      {output?.message ? (
        <p className="mt-1 pl-6 text-xs opacity-80">{output.message}</p>
      ) : null}
    </div>
  );
}
