'use client';

import { MessageResponse } from '@workspace/ui/components/ai-elements/message';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/ui/collapsible';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallPart } from '../../types';
import type { WebSearchSourceItem, WebSearchToolOutput } from './types';

const QUERY_MAX = 50;
const FAVICON_FALLBACK = 'https://www.google.com/s2/favicons?domain=&sz=16';

function getQuery(part: ToolCallPart): string {
  const input = part.input as { query?: string } | undefined;
  const q = input?.query;
  if (typeof q === 'string' && q.trim()) return q.length > QUERY_MAX ? q.slice(0, QUERY_MAX) + '…' : q;
  return '';
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url || '';
  }
}

function getSources(output: WebSearchToolOutput | undefined): Array<WebSearchSourceItem & { domain: string; faviconUrl: string }> {
  if (!output?.sources?.length) return [];
  return output.sources.map((s) => ({
    ...s,
    domain: s.domain ?? getDomain(s.url),
    faviconUrl: s.faviconUrl ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.domain ?? getDomain(s.url))}&sz=16`,
  }));
}

export interface WebSearchAccordionProps {
  part: ToolCallPart;
  partKey: string;
}

/**
 * One accordion per webSearch call. Label is "Searching {query}" when in progress, "Searched {query}" when done.
 */
export function WebSearchAccordion({ part, partKey }: WebSearchAccordionProps) {
  const state = part.state;
  const query = getQuery(part);
  const queryLabel = query || '…';
  const output = part.output as WebSearchToolOutput | undefined;
  const sources = getSources(output);
  const summary = output?.summary?.trim();

  const isError = state === 'output-error';
  const isDone = state === 'output-available' && part.output != null && part.preliminary !== true;
  const isRunning = !isDone && !isError;

  const statusLabel = isRunning ? 'Searching' : 'Searched';

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
        <span>{statusLabel} {queryLabel}</span>
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
          <span>{statusLabel} {queryLabel}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0'
        )}
      >
        <div className="mt-2 space-y-2">
          {summary ? (
            <div className="text-muted-foreground text-sm max-h-48 overflow-y-auto **:text-muted-foreground [&_a]:text-muted-foreground [&_a:hover]:text-muted-foreground/90">
              <MessageResponse>{summary}</MessageResponse>
            </div>
          ) : null}
          <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
            {sources.map((s, i) => (
              <div key={`${s.url}-${i}`} className="flex items-center gap-2 truncate">
                <img
                  src={s.faviconUrl || FAVICON_FALLBACK}
                  alt=""
                  className="size-4 shrink-0 rounded-sm"
                  width={16}
                  height={16}
                />
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate min-w-0"
                  title={s.url}
                >
                  {s.domain || getDomain(s.url)}
                </a>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
