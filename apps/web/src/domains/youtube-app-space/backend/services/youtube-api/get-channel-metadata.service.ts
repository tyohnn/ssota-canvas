/**
 * YouTube 채널 메타데이터 조회 서비스
 *
 * YouTube Data API v3를 사용하여 채널 메타데이터를 가져옵니다.
 */
import { config } from '@/config';

import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { ChannelMetadata } from '../../../shared/types/channel-metadata.types';

/**
 * YouTube 채널 메타데이터 조회
 *
 * @param channelId - YouTube Channel ID
 * @returns 채널 메타데이터
 * @throws YoutubeError - API 호출 실패 시
 */
export async function getChannelMetadata(
  channelId: string
): Promise<ChannelMetadata> {
  const apiKey = config.providers.youtube;

  if (!apiKey) {
    throw new YoutubeError(
      'YOUTUBE_API_KEY_MISSING',
      'YouTube API key is not configured',
      { channelId }
    );
  }

  try {
    // YouTube Data API v3 호출 - channels endpoint
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );

    return await processResponse(response, channelId);
  } catch (error) {
    // YoutubeError인 경우 그대로 throw
    if (error instanceof YoutubeError) {
      throw error;
    }

    // 기타 에러는 YoutubeError로 래핑
    throw new YoutubeError(
      'YOUTUBE_API_ERROR',
      error instanceof Error
        ? error.message
        : 'Failed to fetch channel metadata',
      {
        channelId,
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
  channelId: string
): Promise<ChannelMetadata> {
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
        channelId,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      }
    );
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new YoutubeError('YOUTUBE_API_NOT_FOUND', 'Channel not found', {
      channelId,
    });
  }

  const channel = data.items[0];
  const snippet = channel?.snippet;
  const statistics = channel?.statistics;

  // 채널 썸네일 URL (우선순위: high > medium > default)
  const channelThumbnailUrl =
    snippet?.thumbnails?.high?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    undefined;

  // 구독자 수 (비공개인 경우 undefined)
  const subscriberCount = statistics?.hiddenSubscriberCount
    ? undefined
    : statistics?.subscriberCount
      ? parseInt(statistics.subscriberCount, 10)
      : undefined;

  // 비디오 수
  const videoCount = statistics?.videoCount
    ? parseInt(statistics.videoCount, 10)
    : undefined;

  return {
    channelName: snippet?.title || 'YouTube Channel',
    channelDescription: snippet?.description || undefined,
    channelThumbnailUrl,
    subscriberCount,
    videoCount,
  };
}
