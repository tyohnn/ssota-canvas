/**
 * Application Event Policy: SourceContentExtracted → App Space 저장
 * sourceType에 따라 해당 플랫폼 도메인에 구조화 데이터 저장
 */
import { updateVideoScript } from '@/domains/youtube-app-space/backend/services/script/update-video-script.service';
import { DrizzleVideoRepository } from '@/domains/youtube-app-space/backend/repositories/implementations/drizzle-video.repository';
import type { YoutubeScript } from '@/domains/youtube-app-space/shared/types/transcript.types';

import type { SourceContentExtractedEvent } from '../../../shared/events/source-content-extracted.application-event';

/**
 * 기본 Policy Runner: YouTube인 경우 youtube-app-space에 스크립트 저장
 */
export async function runSourceContentExtractedPolicy(
  event: SourceContentExtractedEvent
): Promise<void> {
  const { sourceType, appSpaceId, structuredPayload, contentLanguage } =
    event.payload;
  if (sourceType === 'youtube' && appSpaceId && structuredPayload) {
    const videoRepo = new DrizzleVideoRepository();
    await updateVideoScript(
      {
        videoId: appSpaceId,
        script: structuredPayload as YoutubeScript,
        scriptLanguage: contentLanguage ?? undefined,
      },
      videoRepo
    );
  }
}
