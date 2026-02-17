'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { BlockSlugParamSchema } from '../../shared/dtos/requests/source.requests';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const GetSourceSummaryLanguagesByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
});
type GetSourceSummaryLanguagesByBlockRequest = z.infer<
  typeof GetSourceSummaryLanguagesByBlockRequestSchema
>;

export const getSourceSummaryLanguagesAction = withSourceBlockSecureAction(
  GetSourceSummaryLanguagesByBlockRequestSchema,
  'getSourceSummaryLanguagesAction',
  getSourceSummaryLanguagesInternal
);

async function getSourceSummaryLanguagesInternal(
  _req: GetSourceSummaryLanguagesByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<{ languages: string[] }>> {
  const repo = new DrizzleSourceSummaryRepository();
  const sourceId = new SourceId(ctx.sourceId);
  const languages = await repo.getAvailableLanguages(sourceId);
  return ok({ languages });
}
