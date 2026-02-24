/**
 * YouTube 영상 메타데이터 조회 서비스
 *
 * YouTube Data API v3를 사용하여 영상 메타데이터를 가져옵니다.
 * YouTube Data API v3를 사용해 영상 메타데이터를 조회합니다.
 */
import { config } from '@/config';

import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { VideoMetadata } from '../../../shared/types/video-metadata.types';
import { parseDuration } from './parse-duration.util';

/**
 * YouTube 영상 메타데이터 조회
 *
 * @param videoId - YouTube Video ID
 * @returns 영상 메타데이터
 * @throws YoutubeError - API 호출 실패 시
 */
export async function getVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const apiKey = config.providers.youtube;

  if (!apiKey) {
    throw new YoutubeError(
      'YOUTUBE_API_KEY_MISSING',
      'YouTube API key is not configured',
      { videoId }
    );
  }

  try {
    // YouTube Data API v3 호출 - videos endpoint
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );

    return await processResponse(response, videoId);
  } catch (error) {
    // YoutubeError인 경우 그대로 throw
    if (error instanceof YoutubeError) {
      throw error;
    }

    // 기타 에러는 YoutubeError로 래핑
    throw new YoutubeError(
      'YOUTUBE_API_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch video metadata',
      {
        videoId,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * YouTube API 응답 처리 헬퍼 함수
 */
async function processResponse(
  response: Response,
  videoId: string
): Promise<VideoMetadata> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorCode: YoutubeError['code'] = 'YOUTUBE_API_ERROR';

    // HTTP 상태 코드에 따른 에러 코드 매핑
    if (response.status === 401) {
      errorCode = 'YOUTUBE_API_UNAUTHORIZED';
    } else if (response.status === 403) {
      errorCode = 'YOUTUBE_API_FORBIDDEN';
    } else if (response.status === 404) {
      errorCode = 'YOUTUBE_API_NOT_FOUND';
    } else if (response.status === 400) {
      errorCode = 'YOUTUBE_API_BAD_REQUEST';
    } else if (response.status === 429) {
      errorCode = 'YOUTUBE_API_RATE_LIMIT_EXCEEDED';
    } else if (response.status >= 500) {
      errorCode = 'YOUTUBE_API_INTERNAL_ERROR';
    }

    throw new YoutubeError(
      errorCode,
      `YouTube API error: ${response.status} ${response.statusText}`,
      {
        videoId,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      }
    );
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new YoutubeError('YOUTUBE_API_NOT_FOUND', 'Video not found', {
      videoId,
    });
  }

  const video = data.items[0];
  const snippet = video?.snippet;
  const contentDetails = video?.contentDetails;
  const statistics = video?.statistics;

  // 영상 길이 파싱 (ISO 8601 duration format: PT1H2M10S)
  let durationSeconds: number | undefined = undefined;
  if (contentDetails?.duration) {
    durationSeconds = parseDuration(contentDetails.duration);
  }

  // 썸네일 URL (우선순위: maxres > high > default)
  const thumbnailUrl =
    snippet?.thumbnails?.maxres?.url ||
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.default?.url ||
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const thumbnailHighUrl =
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.default?.url ||
    undefined;

  // publishedAt을 Date 객체로 변환
  const publishedAt = snippet?.publishedAt
    ? new Date(snippet.publishedAt)
    : undefined;

  // Statistics 데이터 파싱 (문자열을 숫자로 변환)
  const viewCount = statistics?.viewCount
    ? parseInt(statistics.viewCount, 10)
    : undefined;
  const likeCount = statistics?.likeCount
    ? parseInt(statistics.likeCount, 10)
    : undefined;
  const commentCount = statistics?.commentCount
    ? parseInt(statistics.commentCount, 10)
    : undefined;

  return {
    title: snippet?.title || 'YouTube Video',
    description: snippet?.description || undefined,
    channelId: snippet?.channelId || undefined,
    channelTitle: snippet?.channelTitle || undefined,
    publishedAt,
    durationSeconds,
    thumbnailUrl,
    thumbnailHighUrl,
    viewCount,
    likeCount,
    commentCount,
  };
}
