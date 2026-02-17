'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-source-action-transaction.repository';
import { createSourceActionTransaction } from '../../backend/services/source-action-transaction';
import { BlockSlugParamSchema } from '../../shared/dtos/requests/source.requests';
import { SUPPORTED_LANGUAGES } from '../../shared/value-objects/language-code.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const LanguageSchema = z.enum(
  SUPPORTED_LANGUAGES as unknown as [string, ...string[]]
);
const CreateSourceActionTransactionByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
  actionType: z.enum(['extract_content', 'extract_summary']),
  language: LanguageSchema.optional().nullable(),
});
type CreateSourceActionTransactionByBlockRequest = z.infer<
  typeof CreateSourceActionTransactionByBlockRequestSchema
>;

export const createSourceActionTransactionAction = withSourceBlockSecureAction(
  CreateSourceActionTransactionByBlockRequestSchema,
  'createSourceActionTransactionAction',
  createSourceActionTransactionInternal
);

async function createSourceActionTransactionInternal(
  req: CreateSourceActionTransactionByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<{ transactionId: string }>> {
  const repo = new DrizzleSourceActionTransactionRepository();
  const result = await createSourceActionTransaction(
    {
      orgId: ctx.organization.id,
      sourceId: ctx.sourceId,
      actionType: req.actionType,
      language: req.language ?? null,
    },
    repo
  );
  if (result.isError()) {
    return err(result.error.message, {
      code: (result.error as { code?: string }).code ?? 'CREATION_FAILED',
    });
  }
  return ok({
    transactionId: result.value.getTransaction().id.value,
  });
}
