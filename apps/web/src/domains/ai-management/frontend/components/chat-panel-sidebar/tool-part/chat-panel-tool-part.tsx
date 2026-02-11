'use client';

import {
  Task,
  TaskContent,
  TaskTrigger,
} from '@workspace/ui/components/ai-elements/task';
import type { ToolCallPart } from '../types';
import { getToolPartLabel } from '../types';
import { SearchItemAccordion } from './search-item-accordion';
import { SearchPartContent } from './search-part-content';

/** Whether this part is a search tool (xaiSearch or legacy web_search/x_search). */
function isSearchToolPart(part: ToolCallPart): boolean {
  return (
    part.toolName === 'xaiSearch' ||
    part.toolName === 'web_search' ||
    part.toolName === 'x_search' ||
    part.type === 'tool-xaiSearch' ||
    part.type === 'tool-web_search' ||
    part.type === 'tool-x_search'
  );
}

/** True only when every part has final tool result (xaiSearch sends summary/content on last yield). */
function isSearchReallyDone(parts: ToolCallPart[]): boolean {
  return parts.every((p) => {
    const o = p.output as { summary?: string; content?: string } | undefined;
    return (o?.summary != null && o.summary !== '') || (o?.content != null && o.content !== '');
  });
}

/** Task title by state (matches agent-conversation Task pattern). */
function getTaskTitle(part: ToolCallPart): string {
  const label = getToolPartLabel(part);
  switch (part.state) {
    case 'input-streaming':
      return `${label} preparing…`;
    case 'input-available':
      return `${label} running…`;
    case 'output-available':
      return `${label} done`;
    case 'output-error':
      return `${label} failed`;
    default:
      return label;
  }
}

export interface ChatPanelToolPartProps {
  /** Single tool part (for non-search or when not grouping). */
  part?: ToolCallPart;
  /** Multiple xaiSearch parts to render as one Search Task. */
  parts?: ToolCallPart[];
  partKey: string;
}

/**
 * Renders a single tool part as one Task, or multiple xaiSearch parts as one Search Task.
 */
export function ChatPanelToolPart({ part: singlePart, parts: groupedParts, partKey }: ChatPanelToolPartProps) {
  const part = singlePart ?? (groupedParts && groupedParts[0]);
  const parts = groupedParts?.length ? groupedParts : part ? [part] : [];

  const state = part?.state ?? (parts.some((p) => p.state === 'input-streaming') ? 'input-streaming' : parts.some((p) => p.state === 'output-error') ? 'output-error' : parts.every((p) => p.state === 'output-available') ? 'output-available' : 'input-available');
  const isSearch = parts.length > 0 && parts.every(isSearchToolPart);
  const reallyDone = isSearch && isSearchReallyDone(parts);
  const stateForTitle = isSearch ? (reallyDone ? 'output-available' : state) : state;
  const titlePart = parts.length > 1 ? { ...parts[0]!, state: stateForTitle } : (part ?? parts[0]!);
  const title = getTaskTitle({ ...titlePart, state: stateForTitle });
  const defaultOpen = stateForTitle !== 'output-available';

  return (
    <Task key={partKey} defaultOpen={defaultOpen}>
      <TaskTrigger title={title} />
      <TaskContent>
        {isSearch
          ? parts.map((p, idx) => (
              <SearchItemAccordion
                key={(p as { toolCallId?: string }).toolCallId ?? `${partKey}-${idx}`}
                part={p}
                partKey={(p as { toolCallId?: string }).toolCallId ?? `${partKey}-${idx}`}
              />
            ))
          : part && (
              <SearchPartContent
                part={part}
                partKey={partKey}
                isSearch={false}
              />
            )}
      </TaskContent>
    </Task>
  );
}
