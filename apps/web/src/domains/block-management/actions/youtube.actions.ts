/**
 * YouTube Metadata Actions
 *
 * YouTube URL에서 메타데이터를 가져오는 서버 액션
 */

'use server';

/**
 * YouTube Metadata Type
 * "use server" 파일에서는 async 함수만 export 가능하므로 타입만 export
 */
export type YouTubeMetadata = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelThumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  subscriberCount?: number;
  commentCount?: number;
  publishedAt?: string;
};

/**
 * YouTube URL에서 비디오 ID 추출 (내부 헬퍼 함수)
 *
 * @param url - YouTube URL
 * @returns 비디오 ID 또는 null
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * YouTube URL에서 메타데이터를 가져오는 서버 액션
 *
 * 우선순위:
 * 1. YouTube Data API v3 (API Key 필요, 하루 10,000 quota)
 * 2. 웹 스크래핑 (무료, API Key 불필요)
 * 3. Fallback (기본 썸네일만)
 *
 * @param url - 메타데이터를 가져올 YouTube URL
 * @returns YouTube 메타데이터
 */
export async function fetchYouTubeMetadata(
  url: string
): Promise<
  { success: true; data: YouTubeMetadata } | { success: false; error: string }
> {
  try {
    // 비디오 ID 추출
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL',
      };
    }

    // 1순위: YouTube Data API v3 (MVP - 가장 정확하고 안정적)
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('[YouTube] API Key exists:', !!apiKey);

    if (apiKey) {
      console.log('[YouTube] Using API method for videoId:', videoId);
      const full = await fetchYouTubeMetadataFromAPI(videoId);
      if (full) {
        console.log('[YouTube] API data fetched:', {
          title: full.title,
          channelName: full.channelName,
          viewCount: full.viewCount,
          likeCount: full.likeCount,
          subscriberCount: full.subscriberCount,
          commentCount: full.commentCount,
          hasChannelThumbnail: !!full.channelThumbnailUrl,
        });
        return { success: true, data: full };
      } else {
        console.warn('[YouTube] API returned null, falling back to scraping');
      }
    } else {
      console.log('[YouTube] No API key, using web scraping');
    }

    // 2순위: 웹 스크래핑 (API Key 없을 때 fallback)
    const scraped = await fetchYouTubeMetadataByScaping(url);
    if (scraped) {
      console.log('[YouTube] Scraped data:', {
        title: scraped.title,
        channelName: scraped.channelName,
        viewCount: scraped.viewCount,
        likeCount: scraped.likeCount,
        subscriberCount: scraped.subscriberCount,
        commentCount: scraped.commentCount,
        hasChannelThumbnail: !!scraped.channelThumbnailUrl,
      });
      return { success: true, data: scraped };
    }

    // 3순위: Fallback - 최소한의 정보만 구성
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return {
      success: true,
      data: {
        videoId,
        title: 'YouTube Video',
        description: '',
        thumbnailUrl,
        channelName: '',
      },
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch metadata',
    };
  }
}

/**
 * YouTube Data API v3로 메타데이터 가져오기 (향후 구현)
 *
 * 환경 변수에 YOUTUBE_API_KEY를 설정하면 사용 가능
 */
export async function fetchYouTubeMetadataFromAPI(
  videoId: string
): Promise<YouTubeMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    // YouTube Data API v3 호출
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(5000), // 5초 타임아웃
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YouTube API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`YouTube API error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('[YouTube API] Raw response:', JSON.stringify(data, null, 2));

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const snippet = video?.snippet;
    const statistics = video?.statistics;

    console.log('[YouTube API] Snippet:', snippet);
    console.log('[YouTube API] Statistics:', statistics);

    // 조회수, 댓글 수 (숫자로 저장)
    const viewCount = statistics?.viewCount
      ? parseInt(statistics.viewCount)
      : undefined;
    const commentCount = statistics?.commentCount
      ? parseInt(statistics.commentCount)
      : undefined;

    const channelId = snippet?.channelId;
    let channelName = snippet?.channelTitle || '';
    let channelThumbnailUrl: string | undefined = undefined;
    let subscriberCount: number | undefined = undefined;

    console.log('[YouTube API] Extracted from videos API:', {
      videoId,
      title: snippet?.title,
      channelId,
      channelName,
      viewCount,
      commentCount,
    });

    if (channelId) {
      console.log('[YouTube API] Fetching channel data for:', channelId);
      const chRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (chRes.ok) {
        const chData = await chRes.json();
        console.log(
          '[YouTube API] Channel response:',
          JSON.stringify(chData, null, 2)
        );

        const ch = chData.items?.[0];
        channelName = ch?.snippet?.title || channelName;
        // 채널 프로필 이미지 (고해상도 우선)
        channelThumbnailUrl =
          ch?.snippet?.thumbnails?.high?.url ||
          ch?.snippet?.thumbnails?.medium?.url ||
          ch?.snippet?.thumbnails?.default?.url ||
          undefined;
        // 구독자 수 (비공개가 아니면 숫자로 저장)
        subscriberCount = ch?.statistics?.hiddenSubscriberCount
          ? undefined
          : ch?.statistics?.subscriberCount
            ? parseInt(ch.statistics.subscriberCount)
            : undefined;

        console.log('[YouTube API] Extracted from channels API:', {
          channelName,
          channelThumbnailUrl,
          subscriberCount,
          hiddenSubscriberCount: ch?.statistics?.hiddenSubscriberCount,
        });
      } else {
        console.error('[YouTube API] Channel fetch failed:', chRes.status);
      }
    }

    const likeCount = statistics?.likeCount
      ? parseInt(statistics.likeCount)
      : undefined;

    return {
      videoId,
      title: snippet?.title || 'YouTube Video',
      description: snippet?.description || '',
      thumbnailUrl:
        snippet?.thumbnails?.maxres?.url ||
        snippet?.thumbnails?.high?.url ||
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelName,
      channelThumbnailUrl,
      viewCount,
      likeCount,
      subscriberCount,
      commentCount,
      publishedAt: snippet?.publishedAt,
    };
  } catch (error) {
    console.error('Failed to fetch from YouTube API:', error);
    return null;
  }
}

/**
 * 웹 스크래핑으로 YouTube 메타데이터 가져오기 (무료, API Key 불필요)
 *
 * YouTube 페이지 HTML을 직접 파싱하여 메타데이터 추출
 * - API quota 소비 없음
 * - API Key 불필요
 * - YouTube UI 변경 시 파싱 실패 가능성 있음
 *
 * @param url - YouTube URL
 * @returns YouTube 메타데이터 또는 null
 */
export async function fetchYouTubeMetadataByScaping(
  url: string
): Promise<YouTubeMetadata | null> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    // YouTube 페이지 HTML 가져오기
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(8000), // 8초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // 디버깅: HTML 샘플 저장 (첫 5000자)
    console.log(
      '[YouTube Scraping] HTML sample (first 5000 chars):',
      html.substring(0, 5000)
    );

    // HTML에서 메타데이터 파싱
    const metadata = parseYouTubeHtml(html, videoId);
    return metadata;
  } catch (error) {
    console.error('Failed to scrape YouTube metadata:', error);
    return null;
  }
}

/**
 * YouTube HTML 파싱
 *
 * YouTube 페이지의 실제 HTML 구조를 기반으로 메타데이터 추출
 */
function parseYouTubeHtml(html: string, videoId: string): YouTubeMetadata {
  console.log('[YouTube Scraping] Parsing HTML for videoId:', videoId);

  // 제목 추출 - <h1><yt-formatted-string title="제목">
  const title =
    extractText(
      html,
      /<h1[^>]*class="[^"]*ytd-watch-metadata[^"]*"[^>]*>\s*<yt-formatted-string[^>]*title="([^"]+)"/
    ) ||
    extractMetaTag(html, 'og:title') ||
    'YouTube Video';
  console.log('[YouTube Scraping] Title:', title);

  // 채널명 추출 (여러 패턴 시도)
  const channelNamePatterns = [
    /<ytd-channel-name[^>]*>.*?title="([^"]+)"/s,
    /<ytd-channel-name[^>]*>.*?<a[^>]*>([^<]+)<\/a>/s,
    /id="avatar"[^>]*alt="([^"]+)"/,
    /"channelName":"([^"]+)"/,
    /"author":"([^"]+)"/,
    /property="og:video:tag"[^>]*content="([^"]+)"/,
  ];

  let channelName = '';
  for (const pattern of channelNamePatterns) {
    channelName = extractText(html, pattern) || '';
    if (channelName) {
      console.log(
        '[YouTube Scraping] Channel name found with pattern:',
        pattern.source
      );
      break;
    }
  }
  console.log('[YouTube Scraping] Channel name:', channelName);

  // 구독자 수 추출 (여러 패턴 시도)
  const subscriberPatterns = [
    /id="owner-sub-count"[^>]*aria-label="구독자 ([^"]+)"/,
    /id="owner-sub-count"[^>]*>구독자 ([^<]+)</,
    /"subscriberCountText":\{"simpleText":"구독자 ([^"]+)"/,
    /"subscriberCountText":\{"runs":\[\{"text":"구독자 ([^"]+)"/,
  ];

  let subscriberCount = '';
  for (const pattern of subscriberPatterns) {
    subscriberCount = extractText(html, pattern) || '';
    if (subscriberCount) {
      console.log(
        '[YouTube Scraping] Subscriber count found with pattern:',
        pattern.source
      );
      break;
    }
  }
  console.log('[YouTube Scraping] Subscriber count:', subscriberCount);

  // 조회수 추출 - <span>조회수 14만회</span>
  const viewText =
    extractText(html, /<span[^>]*>조회수 ([^<]+)회<\/span>/) ||
    extractText(html, /조회수\s+([^\s]+)회/) ||
    '';
  const viewCount = viewText;
  console.log('[YouTube Scraping] View count:', viewCount);

  // 업로드 날짜 추출 - <span>1개월 전</span>
  const publishedText =
    extractText(html, /"publishDate":"([^"]+)"/) ||
    extractText(html, /"uploadDate":"([^"]+)"/) ||
    extractText(
      html,
      /<span[^>]*>조회수[^<]*<\/span><span[^>]*>\s*<\/span><span[^>]*>([^<]+)<\/span>/
    ) ||
    '';
  console.log('[YouTube Scraping] Published date:', publishedText);

  // 좋아요 수 추출 (여러 패턴 시도)
  const likePatterns = [
    /<like-button-view-model[^>]*>.*?<div[^>]*class="yt-spec-button-shape-next__button-text-content">([^<]+)<\/div>/s,
    /aria-label="나 외에 사용자 ([^명]+)명이 이 동영상을 좋아함"/,
    /aria-label="이 동영상을 ([^\s]+)회 좋아함"/,
    /"label":"좋아요 ([^"]+)"/,
    /"likeCount":"([^"]+)"/,
  ];

  let likeCount: string | undefined = undefined;
  for (const pattern of likePatterns) {
    const extracted = extractText(html, pattern);
    if (extracted) {
      likeCount = extracted;
      console.log(
        '[YouTube Scraping] Like count found with pattern:',
        pattern.source
      );
      break;
    }
  }
  console.log('[YouTube Scraping] Like count:', likeCount);

  // 댓글 수 추출 (여러 패턴 시도)
  const commentPatterns = [
    /<yt-formatted-string[^>]*class="count-text[^"]*"[^>]*>.*?댓글\s*<\/span><span[^>]*>([^<]+)</s,
    /댓글\s*<\/span><span[^>]*>([^<]+)<\/span><span[^>]*>개/,
    /"commentCount":"([^"]+)"/,
    /"commentsCountText":\{"simpleText":"댓글 ([^"]+)"/,
  ];

  let commentCount: string | undefined = undefined;
  for (const pattern of commentPatterns) {
    const extracted = extractText(html, pattern);
    if (extracted) {
      commentCount = extracted;
      console.log(
        '[YouTube Scraping] Comment count found with pattern:',
        pattern.source
      );
      break;
    }
  }
  console.log('[YouTube Scraping] Comment count:', commentCount);

  // 설명 추출
  const description =
    extractText(html, /"description":\{"simpleText":"([^"]+)"/) ||
    extractMetaTag(html, 'og:description') ||
    '';

  // 썸네일 URL
  const thumbnailUrl =
    extractMetaTag(html, 'og:image') ||
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  // 채널 프로필 이미지 (여러 패턴 시도)
  const channelThumbnailPatterns = [
    /<ytd-video-owner-renderer[^>]*>.*?<img[^>]*src="([^"]+)"/s,
    /id="avatar"[^>]*>.*?<img[^>]*src="([^"]+)"/s,
    /"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/,
    /"channelThumbnailUrl":"([^"]+)"/,
  ];

  let channelThumbnailUrl: string | undefined = undefined;
  for (const pattern of channelThumbnailPatterns) {
    const extracted = extractText(html, pattern);
    if (extracted && extracted.includes('yt3.ggpht.com')) {
      channelThumbnailUrl = extracted;
      console.log(
        '[YouTube Scraping] Channel thumbnail found with pattern:',
        pattern.source
      );
      break;
    }
  }
  console.log('[YouTube Scraping] Channel thumbnail:', channelThumbnailUrl);

  const result: YouTubeMetadata = {
    videoId,
    title,
    description,
    thumbnailUrl,
    channelName,
    channelThumbnailUrl,
    // 스크래핑은 한국어 형식("14만", "1.46만")으로 나오므로 정확한 숫자 파싱 불가
    // API 사용을 권장하며, 스크래핑 시에는 undefined 반환
    viewCount: undefined,
    likeCount: undefined,
    subscriberCount: undefined,
    commentCount: undefined,
    publishedAt: publishedText || undefined,
  };

  console.log('[YouTube Scraping] Final result:', result);
  console.log(
    '[YouTube Scraping] Note: Numbers are undefined as scraping returns Korean format (e.g., "14만") - Use API for accurate counts'
  );
  return result;
}

/**
 * YouTube 커스텀 태그에서 텍스트 추출
 */
function extractFromYtTag(
  html: string,
  container: string,
  scope: string,
  tag: string
): string {
  const scopePattern = scope ? `class="[^"]*${scope}[^"]*"` : '';
  const regex = new RegExp(
    `<${container}[^>]*${scopePattern}[^>]*>.*?<${tag}[^>]*>([^<]+)</${tag}>`,
    'is'
  );
  const match = html.match(regex);
  return match?.[1]?.trim() || '';
}

/**
 * 정규식으로 텍스트 추출
 */
function extractText(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return match?.[1]?.trim() || '';
}

/**
 * 메타 태그 추출
 */
function extractMetaTag(html: string, property: string): string {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1]?.trim() || '';
}
