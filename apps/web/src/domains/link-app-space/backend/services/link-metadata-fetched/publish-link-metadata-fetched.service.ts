/**
 * Publish LinkMetadataFetched Event Service (Application Event 패턴)
 *
 * fetchLinkMetadata Use Case 완료 시 Application Event를 발행하고,
 * 서비스에서 event.handle()을 호출해 Use Case Policy를 실행한다.
 * - Domain Event와 동일하게 "이벤트 생성 → handle() 호출" 흐름을 유지한다.
 * - 발행 주체는 Aggregate가 아니라 이 서비스(Application 레이어)이다.
 *
 * Policy: (1) findOrCreateSource(url, 'link') (2) block.sourceId (3) ensureSourceJob
 *
 * @see docs/patterns/backend/policy-and-event-types-guide.md
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

import type { LinkMetadataFetchedEventData } from '../../../shared/events/link-metadata.events';
import { LinkMetadataFetchedEvent } from '../../../shared/events/link-metadata.events';

export type PublishLinkMetadataFetchedPayload = LinkMetadataFetchedEventData;

/**
 * LinkMetadataFetched Policy 실행
 *
 * 1. findOrCreateSource: URL로 source 조회/생성
 * 2. block 조회 (workspaceId + blockId slug)
 * 3. block.sourceId 업데이트
 * 4. ensureSourceJobService: source_summary/job 생성, extract 큐 enqueue
 */
async function runLinkMetadataFetchedPolicy(
  payload: LinkMetadataFetchedEventData
): Promise<string | undefined> {
  const blockRepository = new DrizzleBlockRepository();
  const sourceRepository = new DrizzleSourceRepository();
  const sourceSummaryRepository = new DrizzleSourceSummaryRepository();
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const queueAdapter = createSupabasePgmqQueueAdapter({
    supabase: supabaseAdmin,
  });

  // 1. findOrCreateSource(url, 'link')
  const sourceResult = await findOrCreateSource(
    {
      url: payload.url,
      sourceType: 'link',
      metadata: {},
      rawContent: undefined,
    },
    sourceRepository
  );

  if (sourceResult.isError()) {
    console.warn(
      '[publishLinkMetadataFetched] findOrCreateSource failed:',
      sourceResult.error
    );
    return undefined;
  }

  const sourceId = sourceResult.value.getSource().id.value;

  // 2. block 조회 (workspaceId + blockId slug)
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(payload.workspaceId),
    payload.blockId
  );
  if (!block) return sourceId;

  // 3. block.sourceId 업데이트
  block.updateSourceId(sourceId);
  await blockRepository.update(block);

  // 4. ensureSourceJobService (source_summary/job 생성, extract 큐 enqueue)
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
      '[publishLinkMetadataFetched] ensureSourceJobService failed:',
      result.error
    );
  }
  return sourceId;
}

/**
 * LinkMetadataFetched Application Event 발행
 *
 * 1. runPolicy 생성: runLinkMetadataFetchedPolicy 실행 래퍼
 * 2. LinkMetadataFetchedEvent 인스턴스 생성 (aggregateId, data, runPolicy)
 * 3. event.handle() 호출 → runPolicy 실행
 * 4. resolvedSourceId 반환
 */
export async function publishLinkMetadataFetched(
  payload: PublishLinkMetadataFetchedPayload
): Promise<string | undefined> {
  let resolvedSourceId: string | undefined;
  const runPolicy = async () => {
    resolvedSourceId = await runLinkMetadataFetchedPolicy(payload);
  };

  const event = new LinkMetadataFetchedEvent(
    payload.blockId,
    payload,
    new Date(),
    runPolicy
  );

  await event.handle();
  return resolvedSourceId;
}
