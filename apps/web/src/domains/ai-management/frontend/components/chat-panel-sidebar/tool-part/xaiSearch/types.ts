/**
 * xaiSearch tool part types and helpers.
 *
 * Data flow (where these types come from):
 * 1. Server: executeXaiSearch() in xai-search.service.ts (AsyncGenerator with ai sdk streamText) yields
 *    - XaiSearchIntermediate { sources, summary? } on each source/tool-result event
 *    - XaiSearchFinal { sources, summary } on stream end
 * 2. Vercel AI SDK serializes each yield as tool result and sends to client.
 * 3. Client: part.output (ToolCallPart) receives that payload; shape matches XaiSearchToolOutput.
 */

/** One source item. Comes from xai-search.service yield (sources[].url, title, domain, faviconUrl). */
export interface XaiSearchSourceItem {
  url: string;
  title?: string;
  domain?: string;
  faviconUrl?: string;
}

/**
 * xaiSearch tool result payload. Same shape as executeXaiSearch yield (XaiSearchIntermediate | XaiSearchFinal).
 * Received in part.output when part is a tool-output or tool-result chunk for xaiSearch.
 */
export interface XaiSearchToolOutput {
  sources?: XaiSearchSourceItem[];
  summary?: string;
}

/** Minimal part shape for isXaiSearchToolPart (avoids importing ToolCallPart). */
interface PartWithToolIdentity {
  type?: string;
  toolName?: string;
}

export function isXaiSearchToolPart(part: PartWithToolIdentity): boolean {
  return part.toolName === 'xaiSearch' || part.type === 'tool-xaiSearch';
}
