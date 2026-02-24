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

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
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
      const block = await blockRepository.findByWorkspaceIdAndSlug(
        new WorkspaceId(payload.workspaceId),
        payload.blockId
      );
      if (!block?.sourceId) return;

      const language = payload.language ?? 'en';
      const result = await ensureSourceJobService(
        {
          blockId: block.id.value,
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
