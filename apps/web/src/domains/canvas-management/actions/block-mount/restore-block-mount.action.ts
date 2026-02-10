'use server';

import type { PageActionContext } from '@/domains/common/auth/types';
import { withPageSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import { restoreBlockMount } from '../../backend/services/block-mount/restore-block-mount.service';
import {
  RestoreBlockMountRequest,
  RestoreBlockMountRequestSchema,
} from '../../shared/dtos/requests/block.requests';

/**
 * Block Mount 복구 Server Action
 */
export const restoreBlockMountAction = withPageSecureAction(
  RestoreBlockMountRequestSchema,
  'restoreBlockMountAction',
  restoreBlockMountInternal,
  {
    getLogMetadata: req => ({ blockMountIds: req.blockMountIds }),
  }
);

/**
 *內部 구현
 */
async function restoreBlockMountInternal(
  safeDto: RestoreBlockMountRequest,
  context: PageActionContext
): Promise<ActionResult<{ restoredCount: number; restoredBlockMountIds: string[] }>> {
  try {
    const { authenticatedUser } = context;
    const userId: UserId = new UserId(authenticatedUser.id);

    const blockMountRepository = new DrizzleBlockMountRepository();

    const result = await restoreBlockMount(
      safeDto,
      userId,
      blockMountRepository
    );

    if (result.isError()) {
      return err(String(result.error), {
        code: 'BLOCK_MOUNT_RESTORATION_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok(result.value);
  } catch (error) {
    console.error('[restoreBlockMountInternal] Internal error:', error);
    return err('Internal server error');
  }
}
