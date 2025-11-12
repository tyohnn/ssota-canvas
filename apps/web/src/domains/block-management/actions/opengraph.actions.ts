/**
 * Open Graph Metadata Actions
 *
 * URL에서 오픈그래프 메타데이터를 가져오는 서버 액션
 */

'use server';

/**
 * Open Graph Metadata Type
 * "use server" 파일에서는 async 함수만 export 가능하므로 타입만 export
 */
export type OpenGraphMetadata = {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  domain: string;
  faviconUrl: string;
  type: string;
  author?: string; // 작성자 (article만)
  publishedAt?: string; // 게시일 ISO string (article만)
};

/**
 * URL에서 오픈그래프 메타데이터를 가져오는 서버 액션
 *
 * @param url - 메타데이터를 가져올 URL
 * @returns Open Graph 메타데이터
 */
export async function fetchOpenGraphMetadata(
  url: string
): Promise<
  { success: true; data: OpenGraphMetadata } | { success: false; error: string }
> {
  try {
    // URL 유효성 검증
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    // HTML 페이지 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SSotaBot/1.0; +https://ssota.com)',
      },
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Open Graph 메타데이터 파싱
    const metadata = parseOpenGraphMetadata(html, domain);

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    console.error('Failed to fetch Open Graph metadata:', error);

    // Fallback 데이터 반환
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      return {
        success: true,
        data: {
          title: domain,
          description: url,
          imageUrl: '',
          siteName: domain,
          domain: domain,
          faviconUrl: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          type: 'website',
        },
      };
    } catch {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch metadata',
      };
    }
  }
}

/**
 * HTML에서 Open Graph 메타데이터 파싱
 */
function parseOpenGraphMetadata(
  html: string,
  domain: string
): OpenGraphMetadata {
  // OG 메타 태그 추출
  const ogTitle =
    extractMetaContent(html, 'og:title') ||
    extractMetaContent(html, 'twitter:title') ||
    extractTitleTag(html) ||
    domain;

  const ogDescription =
    extractMetaContent(html, 'og:description') ||
    extractMetaContent(html, 'twitter:description') ||
    extractMetaContent(html, 'description') ||
    '';

  const ogImage =
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'twitter:image') ||
    '';

  const ogSiteName =
    extractMetaContent(html, 'og:site_name') ||
    extractMetaContent(html, 'application-name') ||
    domain;

  const ogType = extractMetaContent(html, 'og:type') || 'website';

  // Article 전용 메타데이터
  const author =
    extractMetaContent(html, 'article:author') ||
    extractMetaContent(html, 'author') ||
    undefined;

  const publishedTime =
    extractMetaContent(html, 'article:published_time') ||
    extractMetaContent(html, 'og:published_time') ||
    undefined;

  // 파비콘 URL (고해상도)
  const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  return {
    title: ogTitle,
    description: ogDescription,
    imageUrl: ogImage,
    siteName: ogSiteName,
    domain: domain,
    faviconUrl: faviconUrl,
    type: ogType,
    author,
    publishedAt: publishedTime,
  };
}

/**
 * HTML에서 메타 태그 content 추출
 */
function extractMetaContent(html: string, property: string): string {
  // og: property 형식
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const ogMatch = html.match(ogRegex);
  if (ogMatch?.[1]) return decodeHtmlEntities(ogMatch[1]);

  // name 형식
  const nameRegex = new RegExp(
    `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const nameMatch = html.match(nameRegex);
  if (nameMatch?.[1]) return decodeHtmlEntities(nameMatch[1]);

  // content가 먼저 오는 경우
  const reverseOgRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
    'i'
  );
  const reverseOgMatch = html.match(reverseOgRegex);
  if (reverseOgMatch?.[1]) return decodeHtmlEntities(reverseOgMatch[1]);

  const reverseNameRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
    'i'
  );
  const reverseNameMatch = html.match(reverseNameRegex);
  if (reverseNameMatch?.[1]) return decodeHtmlEntities(reverseNameMatch[1]);

  return '';
}

/**
 * HTML에서 title 태그 추출
 */
function extractTitleTag(html: string): string {
  const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
  const match = html.match(titleRegex);
  return match?.[1] ? decodeHtmlEntities(match[1]) : '';
}

/**
 * HTML 엔티티 디코딩
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  };

  return text.replace(/&[^;]+;/g, entity => entities[entity] || entity);
}
