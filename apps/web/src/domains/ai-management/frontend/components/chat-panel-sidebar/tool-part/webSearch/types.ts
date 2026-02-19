/**
 * webSearch tool part types and helpers.
 *
 * Data flow (where these types come from):
 * 1. Server: executeXaiSearch() in xai-search.service.ts (AsyncGenerator with ai sdk streamText) yields
 *    - XaiSearchIntermediate { sources, summary? } on each source/tool-result event
 *    - XaiSearchFinal { sources, summary } on stream end
 * 2. Vercel AI SDK serializes each yield as tool result and sends to client.
 * 3. Client: part.output (ToolCallPart) receives that payload; shape matches WebSearchToolOutput.
 */

/** One source item. Comes from xai-search.service yield (sources[].url, title, domain, faviconUrl). */
export interface WebSearchSourceItem {
  url: string;
  title?: string;
  domain?: string;
  faviconUrl?: string;
}

/**
 * webSearch tool result payload. Same shape as executeXaiSearch yield (XaiSearchIntermediate | XaiSearchFinal).
 * Received in part.output when part is a tool-output or tool-result chunk for webSearch.
 */
export interface WebSearchToolOutput {
  sources?: WebSearchSourceItem[];
  summary?: string;
}

/** Minimal part shape for isWebSearchToolPart (avoids importing ToolCallPart). */
interface PartWithToolIdentity {
  type?: string;
  toolName?: string;
}

export function isWebSearchToolPart(part: PartWithToolIdentity): boolean {
  return part.toolName === 'webSearch' || part.type === 'tool-webSearch';
}
