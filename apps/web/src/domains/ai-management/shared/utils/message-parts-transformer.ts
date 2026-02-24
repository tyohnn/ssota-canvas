/**
 * Message parts transformer for storage optimization.
 *
 * Reduces size of UIMessage.parts before persisting to DB, e.g.:
 * - webSearch: keep only { url, title } per source + summary; drop HTML, faviconUrl, domain (derivable).
 */

type Part = Record<string, unknown>;

/** Slimmed webSearch output: { sources: [{ url, title }], summary? } */
const SLIM_WEB_SEARCH_FIELDS = ['url', 'title'] as const;

function slimWebSearchOutput(output: unknown): unknown {
  if (output == null || typeof output !== 'object') return output;
  const obj = output as Record<string, unknown>;
  const sources = obj.sources;
  if (!Array.isArray(sources)) {
    return { ...obj, summary: obj.summary };
  }
  const slimSources = sources.map((s: unknown) => {
    if (s == null || typeof s !== 'object') return s;
    const src = s as Record<string, unknown>;
    const slim: Record<string, unknown> = {};
    for (const k of SLIM_WEB_SEARCH_FIELDS) {
      if (k in src) slim[k] = src[k];
    }
    return slim;
  });
  return { sources: slimSources, summary: obj.summary };
}

/**
 * Transform a single part for storage.
 * Tool-result parts with webSearch are slimmed; others pass through.
 */
function transformPart(part: Part): Part {
  const type = part.type ?? part.toolName;
  if (type === 'webSearch' || type === 'tool-webSearch') {
    if ('output' in part && part.output != null) {
      return { ...part, output: slimWebSearchOutput(part.output) };
    }
  }
  return part;
}

/**
 * Transform UIMessage.parts array for storage (in-place style; returns new array).
 */
export function transformPartsForStorage(parts: unknown[]): unknown[] {
  if (!Array.isArray(parts) || parts.length === 0) return parts;
  return parts.map((p) => transformPart(p as Part));
}
