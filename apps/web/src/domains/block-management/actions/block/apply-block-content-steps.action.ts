'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { applyBlockContentSteps } from '../../backend/services/block/property/apply-block-content-steps.service';
import { BlockManagementError } from '../../shared/errors/block-management.error';
import {
  ApplyBlockContentStepsRequest,
  ApplyBlockContentStepsRequestSchema,
} from '../../shared/dtos/requests/block.requests';
import { BlockContentStepsAppliedDTO } from '../../shared/dtos/responses/block.responses';
import { withBlockSecureAction } from './secure-action';

/**
 * 블록 콘텐츠 Step 적용 Server Action (ProseMirror steps)
 *
 * Security: withBlockSecureAction HOF (동일한 검증 체인)
 *
 * @param request - { blockId, steps, baseVersion }
 * @returns BlockContentStepsAppliedDTO (성공) | Error (실패, CONTENT_VERSION_MISMATCH 시 code로 구분)
 */
export const applyBlockContentStepsAction = withBlockSecureAction(
  ApplyBlockContentStepsRequestSchema,
  'applyBlockContentStepsAction',
  applyBlockContentStepsInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
    }),
  }
);

async function applyBlockContentStepsInternal(
  safeDto: ApplyBlockContentStepsRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<BlockContentStepsAppliedDTO>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const blockRepository = new DrizzleBlockRepository();

    const result = await applyBlockContentSteps({
      safeWorkspaceId: context.workspace.workspaceId,
      safeBlockSlug: safeDto.blockId,
      steps: safeDto.steps,
      baseVersion: safeDto.baseVersion,
      safeUserId: userId,
      blockRepository,
    });

    if (result.isError()) {
      const error = result.error;
      const code =
        error instanceof BlockManagementError
          ? error.code
          : 'BLOCK_UPDATE_FAILED';
      return err(String(error), {
        code,
        meta:
          error instanceof BlockManagementError && error.details
            ? { ...error.details, originalError: error }
            : { originalError: error },
      });
    }

    const responseData: BlockContentStepsAppliedDTO = {
      blockId: safeDto.blockId,
      newVersion: result.value.newVersion,
      updatedAt: result.value.updatedAt,
    };

    return ok(responseData);
  } catch (error) {
    console.error('[applyBlockContentStepsInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
