/**
 * Publish XMetadataFetched Event Service
 *
 * getXMetadata 완료 시 ensureSourceJobService 호출
 */
import { createClient } from '@supabase/supabase-js';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { createSupabasePgmqQueueAdapter } from '@/domains/queue';
import { DrizzleSourceJobRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceSummaryRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '@/domains/source-management/backend/services/source-job';
import type { XMetadataFetchedEventData } from '../../../shared/events/x-metadata.events';
import { XMetadataFetchedEvent } from '../../../shared/events/x-metadata.events';

export async function publishXMetadataFetched(
  payload: XMetadataFetchedEventData
): Promise<void> {
  const blockRepository = new DrizzleBlockRepository();
  const sourceSummaryRepository = new DrizzleSourceSummaryRepository();
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const queueAdapter = createSupabasePgmqQueueAdapter({ supabase });

  const event = new XMetadataFetchedEvent(
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
          '[publishXMetadataFetched] ensureSourceJobService failed:',
          result.error
        );
      }
    }
  );

  await event.handle();
}
