'use client';

import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ToolCallPart } from '../../types';
import type { ReadToolOutput, ReadToolSourceType } from './types';

const SOURCE_LABELS: Record<ReadToolSourceType, string> = {
  note_content: 'Note',
  source_summary: 'Summary',
  source_content: 'Raw Content',
};

function getLabel(part: ToolCallPart): string {
  const output = part.output as ReadToolOutput | undefined;
  const title = output?.title;
  const source = output?.source;
  const sourceLabel = source ? SOURCE_LABELS[source] : 'Block';
  if (title) return `[${title}] ${sourceLabel}`;
  const input = part.input as { blockMountId?: string } | undefined;
  const bmId = input?.blockMountId ?? output?.blockMountId;
  if (bmId) return `${bmId.slice(0, 8)}… ${sourceLabel}`;
  return sourceLabel;
}

function getFullText(part: ToolCallPart, statusLabel: string, output: ReadToolOutput | undefined): string {
  const label = getLabel(part);
  let text = `${statusLabel} ${label}`;
  if (output?.status === 'done' && output.chars != null) {
    const range = output.actualStart != null && output.actualEnd != null
      ? `L${output.actualStart}-${output.actualEnd}`
      : `L1-${output.totalLines}`;
    text += ` (${range})`;
  }
  return text;
}

export interface ReadTriggerItemProps {
  part: ToolCallPart;
  partKey: string;
}

/**
 * read tool part — label only, no content rendering.
 * input-available: Shimmer "Reading". output-available: "Read" + blockMountId.
 */
export function ReadTriggerItem({ part }: ReadTriggerItemProps) {
  const state = part.state;
  const output = part.output as ReadToolOutput | undefined;
  const label = getLabel(part);

  const isError = state === 'output-error';
  const isDone = state === 'output-available' && part.output != null;
  const isRunning = !isDone && !isError;
  const isInputAvailable = state === 'input-available';

  const statusLabel = isRunning ? 'Reading' : 'Read';

  if (isError) {
    const errorText = `${statusLabel} ${label} — ${part.errorText ?? 'Read failed.'}`;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full min-w-0 text-muted-foreground text-sm border-muted border-l-2 pl-4">
            <span className="min-w-0 truncate">
              <span className="text-red-500">✗</span>{' '}
              <span className="text-red-500 truncate">{part.errorText ?? 'Read failed.'}</span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-secondary text-secondary-foreground" hasArrow={false} sideOffset={4}>
          <p className="max-w-xs whitespace-pre-wrap text-xs select-none">{errorText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isInputAvailable || isRunning) {
    const shimmerText: string = `${statusLabel} ${label}`;
    return (
      <div className="flex w-full min-w-0 items-center gap-2 text-muted-foreground text-sm border-muted border-l-2 pl-4">
        <Shimmer as="span" className="text-muted-foreground text-sm min-w-0 truncate">
          {shimmerText}
        </Shimmer>
      </div>
    );
  }

  if (!isDone) return null;

  const fullText = getFullText(part, statusLabel, output);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'group flex w-full min-w-0 items-center gap-2 text-muted-foreground text-sm border-muted border-l-2 pl-4'
          )}
        >
          <span className="min-w-0 truncate">
            {statusLabel} {label}
            {output?.status === 'done' && output.chars != null && (
              <span className="text-muted-foreground/70 ml-1">
                (
                {output.actualStart != null && output.actualEnd != null
                  ? `L${output.actualStart}-${output.actualEnd}`
                  : `L1-${output.totalLines}`}
                , {output.chars} chars)
              </span>
            )}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-secondary text-secondary-foreground" hasArrow={false} sideOffset={4}>
        <p className="max-w-3xs break-words text-xs">{fullText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
