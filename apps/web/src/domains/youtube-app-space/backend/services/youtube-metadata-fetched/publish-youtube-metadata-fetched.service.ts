/**
 * Publish YoutubeMetadataFetched Event Service (Application Event 패턴)
 *
 * getYoutubeMetadata Use Case 완료 시 Application Event를 발행하고,
 * 서비스에서 event.handle()을 호출해 Use Case Policy를 실행한다.
 * - Domain Event와 동일하게 "이벤트 생성 → handle() 호출" 흐름을 유지한다.
 * - 발행 주체는 Aggregate가 아니라 이 서비스(Application 레이어)이다.
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */
import { createClient } from '@supabase/supabase-js';

import {
  createSupabasePgmqQueueAdapter,
  type IQueueAdapter,
} from '@/domains/queue';

import { DrizzleSummaryJobRepository } from '../../repositories/implementations/drizzle-summary-job.repository';
import { DrizzleVideoRepository } from '../../repositories/implementations/drizzle-video.repository';
import { DrizzleVideoSummaryRepository } from '../../repositories/implementations/drizzle-video-summary.repository';
import { ensureVideoSummaryService } from '../summary';
import type { YoutubeMetadataFetchedEventData } from '../../../shared/events/youtube-metadata.events';
import { YoutubeMetadataFetchedEvent } from '../../../shared/events/youtube-metadata.events';

/**
 * YoutubeMetadataFetched Application Event 발행 및 Use Case Policy 실행
 *
 * createVideo의 Domain Event 처리와 동일하게, 이벤트를 생성한 뒤
 * 서비스에서 handle()을 호출한다. (Application Event 패턴)
 */
export async function publishYoutubeMetadataFetched(
  payload: YoutubeMetadataFetchedEventData
): Promise<void> {
  const summaryJobRepository = new DrizzleSummaryJobRepository();
  const videoSummaryRepository = new DrizzleVideoSummaryRepository();
  const videoRepository = new DrizzleVideoRepository();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter: IQueueAdapter = createSupabasePgmqQueueAdapter({
    supabase,
  });

  const event = new YoutubeMetadataFetchedEvent(
    payload.blockId,
    payload,
    new Date(),
    async () => {
      await ensureVideoSummaryService(payload, {
        summaryJobRepository,
        videoSummaryRepository,
        videoRepository,
        queueAdapter,
      });
    }
  );

  await event.handle();
}
