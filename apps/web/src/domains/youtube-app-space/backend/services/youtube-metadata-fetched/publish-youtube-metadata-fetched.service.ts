/**
 * Publish YoutubeMetadataFetched Event Service (Application Event 패턴)
 *
 * getYoutubeMetadata Use Case 완료 시 Application Event를 발행하고,
 * 서비스에서 event.handle()을 호출해 Use Case Policy를 실행한다.
 *
 * 메타데이터 직후: block.sourceId가 있을 때만 ensureSourceJobService 호출.
 * sourceId 없는 블록은 요약 잡을 넣지 않음.
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
 */
import { createClient } from '@supabase/supabase-js';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { createSupabasePgmqQueueAdapter } from '@/domains/queue';
import { DrizzleSourceJobRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceSummaryRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '@/domains/source-management/backend/services/source-job';

import type { YoutubeMetadataFetchedEventData } from '../../../shared/events/youtube-metadata.events';
import { YoutubeMetadataFetchedEvent } from '../../../shared/events/youtube-metadata.events';

export async function publishYoutubeMetadataFetched(
  payload: YoutubeMetadataFetchedEventData
): Promise<void> {
  const blockRepository = new DrizzleBlockRepository();
  const sourceSummaryRepository = new DrizzleSourceSummaryRepository();
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter = createSupabasePgmqQueueAdapter({ supabase });

  const event = new YoutubeMetadataFetchedEvent(
    payload.blockId,
    payload,
    new Date(),
    async () => {
      const block = await blockRepository.findById(new BlockId(payload.blockId));
      if (!block?.sourceId) return;

      const language = payload.language ?? 'en';
      const result = await ensureSourceJobService(
        {
          blockId: payload.blockId,
          orgId: payload.orgId,
          sourceId: block.sourceId,
          language,
        },
        {
          sourceSummaryRepository,
          sourceJobRepository,
          queueAdapter,
        }
      );
      if (result.isError()) {
        console.warn(
          '[publishYoutubeMetadataFetched] ensureSourceJobService failed:',
          result.error
        );
      }
    }
  );

  await event.handle();
}
