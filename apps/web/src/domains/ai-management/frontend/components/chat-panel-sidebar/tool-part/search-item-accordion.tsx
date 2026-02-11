'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/ui/collapsible';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallPart } from '../types';

const QUERY_MAX = 50;

function getQuery(part: ToolCallPart): string {
  const input = part.input as { query?: string } | undefined;
  const q = input?.query;
  if (typeof q === 'string' && q.trim()) return q.length > QUERY_MAX ? q.slice(0, QUERY_MAX) + '…' : q;
  return '';
}

export interface SearchItemAccordionProps {
  part: ToolCallPart;
  partKey: string;
}

/**
 * One accordion per xaiSearch call. Running = single line "Searching {query} in X".
 * Done = "Searched {query} in X" accordion with fixed-height source list and optional summary.
 */
export function SearchItemAccordion({ part, partKey }: SearchItemAccordionProps) {
  const state = part.state;
  const query = getQuery(part);
  const queryLabel = query || '…';
  const output = part.output as
    | {
        summary?: string;
        citations?: Array<{ url: string; title?: string }>;
      }
    | undefined;
  const citations = Array.isArray(output?.citations) ? output.citations : [];
  const summary = output?.summary?.trim();

  const isRunning = state === 'input-streaming' || state === 'input-available';
  const isDone = state === 'output-available' && part.output != null;
  const isError = state === 'output-error';

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
        <span>Searching {queryLabel} in X</span>
      </div>
    );
  }

  if (!isDone) return null;

  return (
    <Collapsible defaultOpen={true} className="border-muted border-l-2 pl-4">
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'group flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground'
          )}
        >
          <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          <span>Searched {queryLabel} in X</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0'
        )}
      >
        <div className="mt-2 space-y-2 border-muted border-l-2 pl-4">
          {summary && (
            <p className="text-muted-foreground text-sm line-clamp-2">{summary}</p>
          )}
          <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
            {citations.map((c, i) => (
              <div key={`${c.url}-${i}`} className="truncate">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate block"
                  title={c.url}
                >
                  {c.title || c.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
