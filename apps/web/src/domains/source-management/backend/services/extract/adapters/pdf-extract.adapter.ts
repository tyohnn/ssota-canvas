/**
 * PDF extract adapter: PDF URL → markdown via Firecrawl API
 *
 * Supports incremental extraction via maxPages / fromPage metadata.
 * Default: first 20 pages. Additional extraction requires explicit fromPage + maxPages.
 *
 * When URL points to localhost (e.g. local Supabase Storage), Firecrawl cannot reach it.
 * We return placeholder content in that case.
 */
import Firecrawl from '@mendable/firecrawl-js';

import { config } from '@/config';

import type { ExtractResult, IExtractAdapter } from './types';

const DEFAULT_MAX_PAGES = 20;

const LOCALHOST_HOSTS = ['127.0.0.1', 'localhost', '::1'];

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return LOCALHOST_HOSTS.includes(host);
  } catch {
    return false;
  }
}

const LOCALHOST_PLACEHOLDER_MARKDOWN = `# PDF (Local File)

This PDF was uploaded from a local development environment. Content extraction is not available for local files—Firecrawl cannot access localhost URLs.

In production (with a public URL), full extraction and summarization will work.`;

export interface PdfExtractionState {
  extractedToPage: number;
  totalPages?: number;
  isComplete: boolean;
}

export class PdfExtractAdapter implements IExtractAdapter {
  async extract(
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<ExtractResult> {
    const maxPages =
      typeof metadata?.maxPages === 'number'
        ? metadata.maxPages
        : DEFAULT_MAX_PAGES;

    // localhost URLs (e.g. local Supabase) are unreachable from Firecrawl; return placeholder
    if (isLocalhostUrl(url)) {
      return {
        rawContent: LOCALHOST_PLACEHOLDER_MARKDOWN,
        structuredPayload: {
          pdfExtraction: {
            extractedToPage: 1,
            totalPages: 1,
            isComplete: true,
          },
        },
        contentLanguage: null,
      };
    }

    const apiKey = config.providers.firecrawl;
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'FIRECRAWL_API_KEY is not configured. Set it in environment variables.'
      );
    }

    const app = new Firecrawl({ apiKey });

    // Firecrawl automatically handles PDF URLs via scrape.
    // parsers.pdf.maxPages: 최대 20페이지까지만 추출 (비용·LLM 컨텍스트 관리)
    let doc;
    try {
      doc = await app.scrape(url, {
        formats: ['markdown'],
        parsers: [{ type: 'pdf', maxPages }],
      } as Parameters<typeof app.scrape>[1]);
    } catch (scrapeErr) {
      throw scrapeErr;
    }

    if (!doc?.markdown || typeof doc.markdown !== 'string') {
      throw new Error(
        'Firecrawl returned no markdown content for the PDF. The file may be inaccessible or corrupted.'
      );
    }

    // Estimate pages from content (rough heuristic: ~500 words per page)
    // Firecrawl doesn't always return page metadata
    const wordCount = doc.markdown.split(/\s+/).length;
    const estimatedTotalPages = Math.ceil(wordCount / 500);

    const pdfExtraction: PdfExtractionState = {
      extractedToPage: maxPages,
      totalPages: estimatedTotalPages > maxPages ? estimatedTotalPages : undefined,
      isComplete: estimatedTotalPages <= maxPages,
    };

    return {
      rawContent: doc.markdown,
      structuredPayload: {
        ...(doc.metadata ?? {}),
        pdfExtraction,
      },
      contentLanguage: (doc.metadata as Record<string, string> | null)?.language ?? null,
    };
  }
}
