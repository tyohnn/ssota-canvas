'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Shimmer } from '@workspace/ui/components/ai-elements/shimmer';
import { TaskItem } from '@workspace/ui/components/ai-elements/task';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import type { ToolCallPart } from '../types';

type StepItem = { message?: string; step?: string };

/** Label for search tool when state is input-available (running or completed). */
function getSearchToolResultLabel(part: ToolCallPart): string {
  const output = part.output as {
    message?: string;
    summary?: string;
    content?: string;
    partialContent?: string;
  } | undefined;
  if (output?.message) return output.message;
  if (output?.summary) return output.summary.slice(0, 80) + (output.summary.length > 80 ? '…' : '');
  if (output?.content) return output.content.slice(0, 80) + (output.content.length > 80 ? '…' : '');
  if (output?.partialContent)
    return output.partialContent.slice(0, 80) + (output.partialContent.length > 80 ? '…' : '');
  const input = part.input as { query?: string } | undefined;
  const query = input?.query;
  if (typeof query === 'string' && query.trim()) {
    return `Search: "${query.slice(0, 60)}${query.length > 60 ? '…' : ''}"`;
  }
  return 'Search';
}

export interface SearchPartContentProps {
  part: ToolCallPart;
  partKey: string;
  isSearch: boolean;
}

/**
 * Renders one part's TaskItems (steps + sources). Used for single non-search tool part only.
 */
export function SearchPartContent({ part, partKey, isSearch }: SearchPartContentProps) {
  const state = part.state;
  const output = part.output as
    | {
        status?: string;
        message?: string;
        summary?: string;
        citations?: Array<{ url: string; title?: string }>;
        steps?: StepItem[];
      }
    | undefined;

  const incomingSteps = isSearch && Array.isArray(output?.steps) ? output.steps : null;
  const [displaySteps, setDisplaySteps] = useState<StepItem[]>([]);
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (incomingSteps && incomingSteps.length > prevLenRef.current) {
      prevLenRef.current = incomingSteps.length;
      setDisplaySteps(incomingSteps);
    }
  }, [incomingSteps]);

  const rawSteps = displaySteps.length > 0 ? displaySteps : incomingSteps;
  const steps = useMemo(() => {
    if (!rawSteps?.length) return rawSteps;
    const foundSourceRe = /^Found \d+ source(s)?$/;
    const filtered: StepItem[] = [];
    let lastFound: StepItem | null = null;
    for (const s of rawSteps) {
      const msg = s.message ?? s.step ?? '';
      if (foundSourceRe.test(msg)) lastFound = s;
      else {
        if (lastFound) {
          filtered.push(lastFound);
          lastFound = null;
        }
        filtered.push(s);
      }
    }
    if (lastFound) filtered.push(lastFound);
    return filtered;
  }, [rawSteps]);

  const citations = Array.isArray(output?.citations) ? output.citations : [];

  if (state === 'input-streaming') {
    return (
      <TaskItem>
        <div className="flex items-center gap-2 text-sm">
          <span className="animate-pulse">⏳</span>
          <Shimmer as="span" className="text-muted-foreground">
            {isSearch ? (output?.message ?? 'Searching…') : 'Preparing tool input…'}
          </Shimmer>
        </div>
      </TaskItem>
    );
  }
  if (state === 'input-available') {
    return (
      <TaskItem>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-500">✓</span>
          <span className="text-muted-foreground">{getSearchToolResultLabel(part)}</span>
        </div>
      </TaskItem>
    );
  }
  if (state === 'output-error') {
    return (
      <TaskItem>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-500">✗</span>
          <span className="text-red-500">{part.errorText ?? 'Tool failed.'}</span>
        </div>
      </TaskItem>
    );
  }
  if (state === 'output-available' && part.output) {
    return (
      <>
        {steps ? (
          steps.map((s, i) => (
            <TaskItem key={i}>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">{s.message ?? s.step ?? '—'}</span>
              </div>
            </TaskItem>
          ))
        ) : (
          <TaskItem>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-500">✓</span>
              <span>
                {typeof part.output === 'object' && part.output !== null
                  ? 'message' in part.output
                    ? String((part.output as { message?: string }).message)
                    : 'summary' in part.output
                      ? String((part.output as { summary?: string }).summary)
                      : 'Done.'
                  : 'Done.'}
              </span>
            </div>
          </TaskItem>
        )}
        {isSearch && citations.length > 0 && (
          <TaskItem>
            <div className="flex items-center gap-2 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-default hover:text-foreground/80 transition-colors">
                    {citations.length} source{citations.length !== 1 ? 's' : ''} found
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  hasArrow={false}
                  sideOffset={6}
                  className="p-1.5 max-w-[min(20rem,90vw)]"
                >
                  <div className="flex gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 text-xs whitespace-nowrap">
                    {citations.map((c, i) => (
                      <a
                        key={`${c.url}-${i}`}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline shrink-0 max-w-48 truncate"
                        onClick={(e) => e.stopPropagation()}
                        title={c.url}
                      >
                        {c.title || c.url}
                      </a>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </TaskItem>
        )}
      </>
    );
  }
  return null;
}
