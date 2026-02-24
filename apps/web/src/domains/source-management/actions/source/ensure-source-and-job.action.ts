/**
 * Ensure Source and Job Action
 *
 * PDF/Link/Audio 블록 등에서 source 생성 + job enqueue를 단일 액션으로 처리.
 * publishLinkMetadataFetched 패턴과 동일하지만, metadata fetch 단계 없이
 * source 생성과 job enqueue만 수행.
 *
 * Usage: PDF 파일 업로드 or URL 붙여넣기 후 호출.
 */
'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { withBlockAggregateSecureAction } from '@/domains/block-management/actions/block/secure-action';
import type { BlockActionContext } from '@/domains/block-management/actions/block/secure-action';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { createSupabasePgmqQueueAdapter } from '@/domains/queue';
import { DrizzleSourceJobRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-job.repository';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { DrizzleSourceSummaryRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceJobService } from '@/domains/source-management/backend/services/source-job';
import { findOrCreateSource } from '@/domains/source-management/backend/services/source';
import { supabaseAdmin } from '@/utils/supabase/server';

const EnsureSourceAndJobRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
  url: z.url({ message: 'Invalid URL' }),
  sourceType: z.enum(['pdf', 'link', 'audio', 'youtube']),
  language: z.string().min(2).max(5).optional().default('en'),
});

export type EnsureSourceAndJobRequest = z.output<
  typeof EnsureSourceAndJobRequestSchema
>;

export const ensureSourceAndJobAction = withBlockAggregateSecureAction(
  EnsureSourceAndJobRequestSchema,
  'ensureSourceAndJobAction',
  ensureSourceAndJobInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, url: req.url, sourceType: req.sourceType }),
  }
);

async function ensureSourceAndJobInternal(
  safeDto: EnsureSourceAndJobRequest,
  context: BlockActionContext
): Promise<
  ActionResult<{
    sourceId: string;
    blockUuid: string;
    alreadyExists: boolean;
  }>
> {
  const blockRepository = new DrizzleBlockRepository();
  const sourceRepository = new DrizzleSourceRepository();
  const sourceSummaryRepository = new DrizzleSourceSummaryRepository();
  const sourceJobRepository = new DrizzleSourceJobRepository();
  const queueAdapter = createSupabasePgmqQueueAdapter({
    supabase: supabaseAdmin,
  });

  // 1. findOrCreateSource
  const sourceResult = await findOrCreateSource(
    {
      url: safeDto.url,
      sourceType: safeDto.sourceType,
      metadata: {},
      rawContent: undefined,
    },
    sourceRepository
  );

  if (sourceResult.isError()) {
    return err('Failed to create source', {
      meta: { cause: sourceResult.error.message },
    });
  }

  const source = sourceResult.value.getSource();
  const sourceId = source.id.value;

  // 2. block 조회 + sourceId 업데이트
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(safeDto.workspaceId),
    safeDto.blockId
  );

  if (!block) {
    return err('Block not found');
  }

  block.updateSourceId(sourceId);
  await blockRepository.update(block);

  // 3. ensureSourceJobService
  const language = safeDto.language ?? 'en';
  const jobResult = await ensureSourceJobService(
    {
      blockId: block.id.value,
      orgId: context.organization.id,
      sourceId,
      language,
    },
    {
      sourceSummaryRepository,
      sourceJobRepository,
      queueAdapter,
    }
  );

  if (jobResult.isError()) {
    return err('Failed to enqueue source job', {
      meta: { cause: jobResult.error.message },
    });
  }

  return ok({
    sourceId,
    blockUuid: block.id.value,
    alreadyExists: jobResult.value.alreadyExists,
  });
}
