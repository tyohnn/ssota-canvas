/**
 * Link extract adapter: URL → markdown via Firecrawl API
 *
 * Uses @mendable/firecrawl-js SDK. Caching is handled by Firecrawl for cost efficiency.
 */
import Firecrawl from '@mendable/firecrawl-js';

import { config } from '@/config';

import type { ExtractResult, IExtractAdapter } from './types';

export class LinkExtractAdapter implements IExtractAdapter {
  async extract(
    url: string,
    _metadata?: Record<string, unknown>
  ): Promise<ExtractResult> {
    const apiKey = config.providers.firecrawl;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'FIRECRAWL_API_KEY is not configured. Set it in environment variables.'
      );
    }

    const app = new Firecrawl({ apiKey });
    const doc = await app.scrape(url, { formats: ['markdown'] });

    if (!doc?.markdown || typeof doc.markdown !== 'string') {
      throw new Error(
        'Firecrawl returned no markdown content. The page may be empty or inaccessible.'
      );
    }

    return {
      rawContent: doc.markdown,
      structuredPayload: doc.metadata,
      contentLanguage: doc.metadata?.language ?? null,
    };
  }
}
