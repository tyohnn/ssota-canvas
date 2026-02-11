/**
 * Types for chat panel message parts (Vercel AI SDK UI stream).
 * Tool call parts use TypedToolCall from the v2 tool set for type-safe args/input.
 */

import type { V2ToolArgs, V2ToolCall } from '@/app/api/agent/v2/tools';

/** Search tool (web_search, x_search) output shape — citations for "All Citations" UI */
export interface SearchToolOutput {
  status?: string;
  summary?: string;
  results?: unknown[];
  citations?: Array<{ url: string; title?: string }>;
}

/** Text part from assistant or user */
export interface TextPart {
  type: 'text';
  text: string;
}

/** Step start marker in assistant message */
export interface StepStartPart {
  type: 'step-start';
}

/** Reasoning/thinking part from grok reasoning models */
export interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

/** Citation/source URL from stream (e.g. sendSources) or search tool output */
export interface SourceUrlPart {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
}

/** Tool invocation state (for tools with execute, e.g. search sub-agent) */
export type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

/**
 * Tool invocation part (streaming or complete).
 * Payload typed via V2ToolCall / V2ToolArgs; UI stream uses `input` (and optionally `args`) for tool arguments.
 */
export interface ToolCallPart {
  type: 'tool-call' | 'tool-done' | `tool-${string}`;
  toolName?: V2ToolCall['toolName'];
  toolCallId?: string;
  /** Streamed/partial or final input – matches v2 tool args (e.g. search: { query }) */
  input?: V2ToolArgs;
  /** Legacy/alternate args shape */
  args?: V2ToolArgs;
  state?: ToolPartState;
  /** For search tool: preliminary yields (status, message) or final (status: 'complete', summary, results, citations) */
  output?: SearchToolOutput | { message?: string;[k: string]: unknown };
  errorText?: string;
}

export type ChatPanelMessagePart =
  | TextPart
  | StepStartPart
  | SourceUrlPart
  | ReasoningPart
  | ToolCallPart;

export function isSourceUrlPart(part: unknown): part is SourceUrlPart {
  return (part as { type?: string })?.type === 'source-url';
}

export function isDoneToolPart(part: unknown): part is ToolCallPart {
  const p = part as { type?: string; toolName?: string };
  return (
    p?.type === 'tool-done' ||
    (p?.type === 'tool-call' && p?.toolName === 'done')
  );
}

export function isTextPart(part: unknown): part is TextPart {
  return (part as { type?: string })?.type === 'text';
}

export function isReasoningPart(part: unknown): part is ReasoningPart {
  return (part as { type?: string })?.type === 'reasoning';
}

/** Any tool part (tool-call, tool-done, or tool-{name}) */
export function isToolPart(part: unknown): part is ToolCallPart {
  const p = part as { type?: string };
  return (
    typeof p?.type === 'string' &&
    (p.type === 'tool-call' ||
      p.type === 'tool-done' ||
      p.type.startsWith('tool-'))
  );
}

/** xaiSearch tool part only (for grouping multiple searches into one Task in the UI). */
export function isXaiSearchToolPart(part: ToolCallPart): boolean {
  return (
    part.type === 'tool-xaiSearch' ||
    part.toolName === 'xaiSearch'
  );
}

/** Get current (possibly partial) answer string from a done tool part */
export function getDonePartAnswer(part: ToolCallPart): string {
  const input = part.input as { answer?: string } | undefined;
  const args = part.args as { answer?: string } | undefined;
  return input?.answer ?? args?.answer ?? '';
}

/** Human-readable tool label for Task title */
export function getToolPartLabel(part: ToolCallPart): string {
  const p: { type?: string; toolName?: string } = part;
  const typeStr = String(p.type ?? '');
  const name =
    p.toolName ??
    (typeStr.startsWith('tool-') ? typeStr.replace(/^tool-/, '') : 'Tool');
  if (name === 'search' || name === 'xaiSearch') return 'Search';
  return name;
}

/** Citation shape for "All Citations" from search tool output */
export interface CitationItem {
  url: string;
  title?: string;
}

/** Extract citations from a search tool part's output (when status is 'complete'). */
export function getSearchCitations(part: ToolCallPart): CitationItem[] {
  const out = part.output as SearchToolOutput | undefined;
  if (!out || !Array.isArray(out.citations)) return [];
  return out.citations.map((c: CitationItem) => ({ url: c.url, title: c.title }));
}
