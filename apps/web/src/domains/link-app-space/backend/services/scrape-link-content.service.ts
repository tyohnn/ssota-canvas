/**
 * Firecrawl 기반 링크 콘텐츠 스크래핑
 *
 * 1회 호출로 metadata + markdown 추출 (Firecrawl 크레딧 절약)
 */
import Firecrawl from '@mendable/firecrawl-js';

import { config } from '@/config';

import type { OpenGraphMetadata } from '../../shared/types/open-graph-metadata';

export type { OpenGraphMetadata };

export type ScrapeLinkContentResult =
  | { success: true; metadata: OpenGraphMetadata; markdown: string | null }
  | { success: false; error: string };

function buildFallbackMetadata(url: string): OpenGraphMetadata {
  const domain = new URL(url).hostname.replace('www.', '');
  return {
    title: domain,
    description: url,
    imageUrl: '',
    siteName: domain,
    domain,
    faviconUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    type: 'website',
  };
}

function mapFirecrawlMetadataToOg(
  url: string,
  meta?: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogSiteName?: string;
    favicon?: string;
    publishedTime?: string;
    [key: string]: unknown;
  }
): OpenGraphMetadata {
  const domain = new URL(url).hostname.replace('www.', '');
  return {
    title: meta?.ogTitle ?? meta?.title ?? domain,
    description: meta?.ogDescription ?? meta?.description ?? '',
    imageUrl: meta?.ogImage ?? '',
    siteName: meta?.ogSiteName ?? domain,
    domain,
    faviconUrl: meta?.favicon ?? `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    type: 'website',
    publishedAt: meta?.publishedTime,
  };
}

/**
 * Firecrawl scrape으로 metadata + markdown 1회 추출
 */
export async function scrapeLinkContent(
  url: string
): Promise<ScrapeLinkContentResult> {
  const apiKey = config.providers.firecrawl;
  if (!apiKey?.trim()) {
    return { success: false, error: 'FIRECRAWL_API_KEY is not configured.' };
  }

  try {
    const app = new Firecrawl({ apiKey });
    const doc = await app.scrape(url, { formats: ['markdown'] });

    const metadata = mapFirecrawlMetadataToOg(url, doc?.metadata);
    const markdown =
      doc?.markdown && typeof doc.markdown === 'string'
        ? doc.markdown
        : null;

    return {
      success: true,
      metadata,
      markdown,
    };
  } catch {
    return {
      success: true,
      metadata: buildFallbackMetadata(url),
      markdown: null,
    };
  }
}
