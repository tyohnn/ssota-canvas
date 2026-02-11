'use server';

import { ActionResult, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { PublishedPageSourceContext } from '../secure-action';
import { withPublishedPageSourceSecureAction } from '../secure-action';

const GetSourceSummaryLanguagesForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  blockId: z.string().uuid(),
  sourceId: z.string().uuid(),
});
type GetSourceSummaryLanguagesForPublishedPageRequest = z.infer<
  typeof GetSourceSummaryLanguagesForPublishedPageRequestSchema
>;

export const getSourceSummaryLanguagesForPublishedPageAction =
  withPublishedPageSourceSecureAction(
    GetSourceSummaryLanguagesForPublishedPageRequestSchema,
    'getSourceSummaryLanguagesForPublishedPageAction',
    getSourceSummaryLanguagesForPublishedPageInternal
  );

async function getSourceSummaryLanguagesForPublishedPageInternal(
  _req: GetSourceSummaryLanguagesForPublishedPageRequest,
  ctx: PublishedPageSourceContext
): Promise<ActionResult<{ languages: string[] }>> {
  const repo = new DrizzleSourceSummaryRepository();
  const languages = await repo.getAvailableLanguages(new SourceId(ctx.sourceId));
  return ok({ languages });
}
