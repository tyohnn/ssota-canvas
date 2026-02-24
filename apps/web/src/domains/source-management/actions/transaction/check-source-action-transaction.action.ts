'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleSourceActionTransactionRepository } from '../../backend/repositories/implementations/drizzle-source-action-transaction.repository';
import { checkSourceActionTransaction } from '../../backend/services/source-action-transaction';
import type { CheckSourceActionTransactionResult } from '../../backend/services/source-action-transaction';
import { BlockSlugParamSchema } from '../../shared/dtos/requests/source.requests';
import { SUPPORTED_LANGUAGES } from '../../shared/value-objects/language-code.vo';
import type { SourceBlockActionContext } from '../secure-action';
import { withSourceBlockSecureAction } from '../secure-action';

const LanguageSchema = z.enum(
  SUPPORTED_LANGUAGES as unknown as [string, ...string[]]
);
const CheckSourceActionTransactionByBlockRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugParamSchema,
  actionType: z.string(),
  language: LanguageSchema.optional().nullable(),
});
type CheckSourceActionTransactionByBlockRequest = z.infer<
  typeof CheckSourceActionTransactionByBlockRequestSchema
>;

export const checkSourceActionTransactionAction = withSourceBlockSecureAction(
  CheckSourceActionTransactionByBlockRequestSchema,
  'checkSourceActionTransactionAction',
  checkSourceActionTransactionInternal
);

async function checkSourceActionTransactionInternal(
  req: CheckSourceActionTransactionByBlockRequest,
  ctx: SourceBlockActionContext
): Promise<ActionResult<CheckSourceActionTransactionResult>> {
  const repo = new DrizzleSourceActionTransactionRepository();
  const result = await checkSourceActionTransaction(
    {
      orgId: ctx.organization.id,
      sourceId: ctx.sourceId,
      actionType: req.actionType,
      language: req.language ?? undefined,
    },
    repo
  );
  if (result.isError()) {
    return err(result.error.message, { code: 'CHECK_FAILED' });
  }
  return ok(result.value);
}
