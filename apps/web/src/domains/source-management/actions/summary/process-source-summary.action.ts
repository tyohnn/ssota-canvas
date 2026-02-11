'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceRepository } from '../../backend/repositories/implementations/drizzle-source.repository';
import { DrizzleSourceSummaryRepository } from '../../backend/repositories/implementations/drizzle-source-summary.repository';
import { ensureSourceSummary } from '../../backend/services/source-summary';
import { SUPPORTED_LANGUAGES } from '../../shared/value-objects/language-code.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const LanguageSchema = z.enum(
  SUPPORTED_LANGUAGES as unknown as [string, ...string[]]
);
const ProcessSourceSummaryByBlockRequestSchema = z.object({
  blockId: z.string().uuid(),
  language: LanguageSchema,
});
type ProcessSourceSummaryByBlockRequest = z.infer<
  typeof ProcessSourceSummaryByBlockRequestSchema
>;

export const processSourceSummaryAction = withSourceBlockSecureAction(
  ProcessSourceSummaryByBlockRequestSchema,
  'processSourceSummaryAction',
  processSourceSummaryInternal
);

async function processSourceSummaryInternal(
  req: ProcessSourceSummaryByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<{ ok: true }>> {
  const sourceRepo = new DrizzleSourceRepository();
  const summaryRepo = new DrizzleSourceSummaryRepository();
  await ensureSourceSummary(
    {
      sourceId: ctx.sourceId,
      orgId: ctx.organization.id,
      language: req.language,
    },
    sourceRepo,
    summaryRepo
  );
  return ok({ ok: true });
}
