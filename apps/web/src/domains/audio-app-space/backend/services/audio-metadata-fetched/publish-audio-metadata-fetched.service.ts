/**
 * Publish AudioMetadataFetched Event Service
 *
 * Policy: (1) findOrCreateSource(url, 'audio') (2) block.sourceId (3) ensureSourceJob
 */
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { createSupabasePgmqQueueAdapter } from '@/domains/queue';
import { DrizzleSourceJobRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { DrizzleSourceSummaryRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '@/domains/source-management/backend/services/source-job';
import { findOrCreateSource } from '@/domains/source-management/backend/services/source';
import { supabaseAdmin } from '@/utils/supabase/server';

import type { AudioMetadataFetchedEventData } from '../../../shared/events/audio-metadata.events';
import { AudioMetadataFetchedEvent } from '../../../shared/events/audio-metadata.events';

export type PublishAudioMetadataFetchedPayload = AudioMetadataFetchedEventData;

async function runAudioMetadataFetchedPolicy(
  payload: AudioMetadataFetchedEventData
): Promise<string | undefined> {
  const blockRepository = new DrizzleBlockRepository();
  const sourceRepository = new DrizzleSourceRepository();
  const sourceSummaryRepository = new DrizzleSourceSummaryRepository();
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const queueAdapter = createSupabasePgmqQueueAdapter({
    supabase: supabaseAdmin,
  });

  const sourceResult = await findOrCreateSource(
    {
      url: payload.url,
      sourceType: 'audio',
      metadata: {},
      rawContent: undefined,
    },
    sourceRepository
  );

  if (sourceResult.isError()) {
    console.warn(
      '[publishAudioMetadataFetched] findOrCreateSource failed:',
      sourceResult.error
    );
    return undefined;
  }

  const sourceId = sourceResult.value.getSource().id.value;

  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(payload.workspaceId),
    payload.blockId
  );
  if (!block) return sourceId;

  block.updateSourceId(sourceId);
  await blockRepository.update(block);

  const language = payload.language ?? 'en';
  const result = await ensureSourceJobService(
    {
      blockId: block.id.value,
      orgId: payload.orgId,
      sourceId,
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
      '[publishAudioMetadataFetched] ensureSourceJobService failed:',
      result.error
    );
  }
  return sourceId;
}

export async function publishAudioMetadataFetched(
  payload: PublishAudioMetadataFetchedPayload
): Promise<string | undefined> {
  let resolvedSourceId: string | undefined;
  const runPolicy = async () => {
    resolvedSourceId = await runAudioMetadataFetchedPolicy(payload);
  };

  const event = new AudioMetadataFetchedEvent(
    payload.blockId,
    payload,
    new Date(),
    runPolicy
  );

  await event.handle();
  return resolvedSourceId;
}
