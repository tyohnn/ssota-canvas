'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import type { SourceSummaryDTO } from '../../shared/dtos/responses/source-summary.responses';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { PublishedPageSourceContext } from '../secure-action';
import { withPublishedPageSourceSecureAction } from '../secure-action';

const GetSourceSummaryForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  blockId: z.string().uuid(),
  sourceId: z.string().uuid(),
  language: z.string().length(2),
});
type GetSourceSummaryForPublishedPageRequest = z.infer<
  typeof GetSourceSummaryForPublishedPageRequestSchema
>;

export const getSourceSummaryForPublishedPageAction =
  withPublishedPageSourceSecureAction(
    GetSourceSummaryForPublishedPageRequestSchema,
    'getSourceSummaryForPublishedPageAction',
    getSourceSummaryForPublishedPageInternal
  );

async function getSourceSummaryForPublishedPageInternal(
  req: GetSourceSummaryForPublishedPageRequest,
  ctx: PublishedPageSourceContext
): Promise<ActionResult<SourceSummaryDTO>> {
  const repo = new DrizzleSourceSummaryRepository();
  const summary = await repo.findBySourceIdAndLanguage(
    new SourceId(ctx.sourceId),
    req.language
  );
  if (!summary) {
    return err('Source summary not found', { code: 'SOURCE_SUMMARY_NOT_FOUND' });
  }
  return ok({
    sourceId: summary.sourceId.value,
    language: summary.language.value,
    summary: summary.summary,
    keywords: summary.keywords,
    updatedAt: summary.updatedAt,
  });
}
