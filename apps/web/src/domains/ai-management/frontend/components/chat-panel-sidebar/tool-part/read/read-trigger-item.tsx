'use client';

import { cn } from '@/lib/utils';
import type { ToolCallPart } from '../../types';
import type { ReadToolOutput } from './types';

function getLabel(part: ToolCallPart): string {
  const input = part.input as { blockMountId?: string; startLine?: number; endLine?: number } | undefined;
  const output = part.output as ReadToolOutput | undefined;
  if (output?.title) return output.title;
  const bmId = input?.blockMountId ?? output?.blockMountId;
  if (bmId) return bmId.slice(0, 12) + '…';
  return 'Block';
}

export interface ReadTriggerItemProps {
  part: ToolCallPart;
  partKey: string;
}

/**
 * read tool part — same trigger shape as webSearch, but non-accordion (content always visible).
 */
export function ReadTriggerItem({ part, partKey }: ReadTriggerItemProps) {
  const state = part.state;
  const output = part.output as ReadToolOutput | undefined;
  const label = getLabel(part);

  const isError = state === 'output-error';
  const isDone = state === 'output-available' && part.output != null;
  const isRunning = !isDone && !isError;

  const statusLabel = isRunning ? 'Reading' : 'Read';

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
        <span>{statusLabel} {label}</span>
      </div>
    );
  }

  if (!isDone) return null;

  return (
    <div className="border-muted border-l-2 pl-4">
      <div
        className={cn(
          'group flex w-full items-center gap-2 text-muted-foreground text-sm'
        )}
      >
        <span>{statusLabel} {label}</span>
      </div>
      {/* Content always visible — not accordion */}
      {output?.content ? (
        <pre className="mt-2 text-muted-foreground text-xs max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
          {output.content}
        </pre>
      ) : null}
    </div>
  );
}
