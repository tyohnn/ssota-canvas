'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import type { SourceSummaryDTO } from '../../shared/dtos/responses/source-summary.responses';
import { LanguageCode } from '../../shared/value-objects/language-code.vo';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const GetSourceSummaryByBlockRequestSchema = z.object({
  blockId: z.string().uuid(),
  language: z.string().length(2),
});
type GetSourceSummaryByBlockRequest = z.infer<
  typeof GetSourceSummaryByBlockRequestSchema
>;

export const getSourceSummaryAction = withSourceBlockSecureAction(
  GetSourceSummaryByBlockRequestSchema,
  'getSourceSummaryAction',
  getSourceSummaryInternal
);

async function getSourceSummaryInternal(
  req: GetSourceSummaryByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<SourceSummaryDTO>> {
  const repo = new DrizzleSourceSummaryRepository();
  const sourceId = new SourceId(ctx.sourceId);
  const language = new LanguageCode(req.language);
  const summary = await repo.findBySourceIdAndLanguage(sourceId, language.value);
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
