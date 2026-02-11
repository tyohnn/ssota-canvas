'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleSourceRepository } from '../../backend/repositories/implementations/drizzle-source.repository';
import {
  GetSourceContentByBlockRequestSchema,
  type GetSourceContentByBlockRequest,
} from '../../shared/dtos/requests/source.requests';
import type { SourceContentDTO } from '../../shared/dtos/responses/source.responses';
import { SourceId } from '../../shared/value-objects/source-id.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

export const getSourceContentAction = withSourceBlockSecureAction(
  GetSourceContentByBlockRequestSchema,
  'getSourceContentAction',
  getSourceContentInternal
);

async function getSourceContentInternal(
  safeDto: GetSourceContentByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<SourceContentDTO>> {
  const repo = new DrizzleSourceRepository();
  const source = await repo.findById(new SourceId(ctx.sourceId));
  if (!source) {
    return err('Source not found', { code: 'SOURCE_NOT_FOUND' });
  }
  const dto: SourceContentDTO = {
    sourceId: source.id.value,
    rawContent: source.rawContent,
    contentLanguage: source.contentLanguage?.value ?? null,
    extractedAt: source.extractedAt,
  };
  return ok(dto);
}
