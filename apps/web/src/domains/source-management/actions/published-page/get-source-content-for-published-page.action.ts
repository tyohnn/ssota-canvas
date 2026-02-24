'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceRepository } from '../../backend/repositories/implementations/drizzle-source.repository';
import type { SourceContentDTO } from '../../shared/dtos/responses/source.responses';
import { BlockSlugParamSchema } from '../../shared/dtos/requests/source.requests';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { PublishedPageSourceContext } from '../secure-action';
import { withPublishedPageSourceSecureAction } from '../secure-action';

const GetSourceContentForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  blockId: BlockSlugParamSchema,
  sourceId: z.uuid(),
});
type GetSourceContentForPublishedPageRequest = z.infer<
  typeof GetSourceContentForPublishedPageRequestSchema
>;

export const getSourceContentForPublishedPageAction =
  withPublishedPageSourceSecureAction(
    GetSourceContentForPublishedPageRequestSchema,
    'getSourceContentForPublishedPageAction',
    getSourceContentForPublishedPageInternal
  );

async function getSourceContentForPublishedPageInternal(
  _req: GetSourceContentForPublishedPageRequest,
  ctx: PublishedPageSourceContext
): Promise<ActionResult<SourceContentDTO>> {
  const repo = new DrizzleSourceRepository();
  const source = await repo.findById(new SourceId(ctx.sourceId));
  if (!source) {
    return err('Source not found', { code: 'SOURCE_NOT_FOUND' });
  }
  const dto: SourceContentDTO = {
    sourceId: source.id.value,
    rawContent: source.rawContent,
    contentLanguage: source.contentLanguage ?? null,
    extractedAt: source.extractedAt,
  };
  return ok(dto);
}
