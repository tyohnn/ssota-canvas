/**
 * External Search Tool Services
 *
 * 외부 검색: xai (웹/X).
 */

import { z } from 'zod';
import { executeXaiSearch } from './xai-search.service';
export type {
  XaiSearchYield,
  XaiSearchFinal,
  XaiSearchIntermediate,
  XaiSearchSource,
} from './xai-search.service';

// ============================================================================
// Step 1-3: Search (Server-side — xAI Live Search via dedicated tool)
// ============================================================================
// xaiSearch runs on the server: it calls xAI with searchParameters and returns
// content + citations. The main agent uses Chat API only (no Responses API),
// so we can mix this server tool with client-side renderCanvasdown/patchCanvasdown.

const xaiSearchArgsSchema = z.object({
  query: z.string().describe('Search query (e.g. "latest news about X", "what is Y")'),
});

/**
 * xaiSearch - Server-side tool that runs xAI Live Search.
 * Execute is attached in route.ts (calls generateText with searchParameters).
 */
export const xaiSearchTool = {
  description: `Search the web or X for more detailed information.

Call with a clear query. Use a single language for the query.`,
  inputSchema: xaiSearchArgsSchema,
  execute: (args: z.infer<typeof xaiSearchArgsSchema>, opts?: { abortSignal?: AbortSignal }) =>
    executeXaiSearch(args, { abortSignal: opts?.abortSignal }),
};

