/**
 * Fast Link Metadata Service
 *
 * HTML fetch + OG tag 파싱으로 빠른 metadata 추출 (Firecrawl 없이).
 * 링크 블록 UI 즉시 렌더링용. markdown/raw_content는 Source Job에서 LinkExtractAdapter가 Firecrawl로 처리.
 */
import type { OpenGraphMetadata } from '../../shared/types/open-graph-metadata';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function buildFallbackMetadata(url: string): OpenGraphMetadata {
  const domain = getDomain(url);
  return {
    title: domain || 'Unknown',
    description: url,
    imageUrl: '',
    siteName: domain,
    domain,
    faviconUrl: domain
      ? `https://icons.duckduckgo.com/ip3/${domain}.ico`
      : '',
    type: 'website',
  };
}

/**
 * meta 태그에서 content 추출
 * <meta property="og:title" content="..."> 또는 <meta name="og:title" content="...">
 */
function extractMetaContent(
  html: string,
  property: string
): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["'](?:og:)?${property}["'][^>]+content=["']([^"']*)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["'](?:og:)?${property}["']`,
      'i'
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1]?.trim() ?? null;
}

/**
 * fetch + OG 파싱으로 metadata 추출 (Firecrawl 미사용)
 */
export async function fetchLinkMetadataFast(
  url: string
): Promise<OpenGraphMetadata> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return buildFallbackMetadata(url);
    }

    const html = await res.text();
    const domain = getDomain(url);

    const ogTitle =
      extractMetaContent(html, 'title') ??
      extractMetaContent(html, 'site_name') ??
      extractTitle(html) ??
      domain;
    const ogDescription =
      extractMetaContent(html, 'description') ?? '';
    const ogImage = extractMetaContent(html, 'image') ?? '';
    const ogSiteName =
      extractMetaContent(html, 'site_name') ?? domain;

    return {
      title: ogTitle,
      description: ogDescription,
      imageUrl: ogImage,
      siteName: ogSiteName,
      domain,
      faviconUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      type: 'website',
    };
  } catch {
    return buildFallbackMetadata(url);
  }
}
