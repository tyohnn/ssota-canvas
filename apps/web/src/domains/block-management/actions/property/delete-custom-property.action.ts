'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { deleteCustomProperty } from '../../backend/services/custom-property';
import type { CustomPropertyDeletedDTO } from '../../shared/dtos';
import {
  type DeleteCustomPropertyRequest,
  DeleteCustomPropertyRequestSchema,
} from '../../shared/dtos/requests';

import type { PropertyActionContext } from './secure-action';
import { withPropertySecureAction } from './secure-action';

/**
 * Custom Property 삭제 Server Action
 *
 * Security: withPropertySecureAction (workspace 권한 + Block 조회 후 blockAggregate 전달)
 */
export const deleteCustomPropertyAction = withPropertySecureAction(
  DeleteCustomPropertyRequestSchema,
  'deleteCustomPropertyAction',
  deleteCustomPropertyInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, propertyId: req.propertyId }),
  }
);

async function deleteCustomPropertyInternal(
  request: DeleteCustomPropertyRequest,
  context: PropertyActionContext
): Promise<ActionResult<CustomPropertyDeletedDTO>> {
  try {
    const blockRepository = new DrizzleBlockRepository();

    const result = await deleteCustomProperty({
      blockAggregate: context.blockAggregate,
      blockRepository,
      propertyId: request.propertyId,
    });

    return ok<CustomPropertyDeletedDTO>({
      blockId: request.blockId,
      workspaceId: request.workspaceId,
      propertyId: request.propertyId,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error('[deleteCustomPropertyInternal] Internal error:', {
      userId: context.authenticatedUser.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to delete property'
    );
  }
}
