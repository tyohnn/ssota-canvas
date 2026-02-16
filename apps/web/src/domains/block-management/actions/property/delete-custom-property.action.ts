'use server';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  verifyAccess,
} from '@/domains/common/auth/helpers';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { BlockCustomPropertyService } from '../../backend/services/custom-property';
import type { CustomPropertyDeletedDTO } from '../../shared/dtos';
import {
  type DeleteCustomPropertyRequest,
  DeleteCustomPropertyRequestSchema,
} from '../../shared/dtos/requests';

export async function deleteCustomPropertyAction(
  request: unknown
): Promise<ActionResult<CustomPropertyDeletedDTO>> {
  const parseResult = DeleteCustomPropertyRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to deleteCustomPropertyAction',
      parseResult.error.issues
    );
    return err('Invalid request data', {
      code: 'INVALID_REQUEST',
      issues: parseResult.error.issues,
    });
  }

  const validatedRequest = parseResult.data;

  try {
    const user = await getAuthenticatedUser();
    const accessResult = await verifyAccess(
      validatedRequest.orgId,
      validatedRequest.workspaceId,
      user.id
    );

    if (!accessResult.success) {
      console.warn('[Security] Access denied', {
        userId: user.id,
        orgId: validatedRequest.orgId,
        workspaceId: validatedRequest.workspaceId,
        error: accessResult.error,
      });

      return err(getAuthErrorMessage(accessResult.error), {
        code: accessResult.error || 'ACCESS_DENIED',
      });
    }

    return await deleteCustomPropertyInternal(validatedRequest, user);
  } catch (error) {
    console.error('[deleteCustomPropertyAction] Failed to delete property', {
      error,
    });

    return err(
      error instanceof Error ? error.message : 'Failed to delete property'
    );
  }
}

async function deleteCustomPropertyInternal(
  request: DeleteCustomPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<CustomPropertyDeletedDTO>> {
  try {
    const repository = new DrizzleBlockRepository();
    const service = new BlockCustomPropertyService(repository);

    const result = await service.deleteCustomProperty({
      blockSlug: request.blockId,
      workspaceId: request.workspaceId,
      propertyId: request.propertyId,
    });

    return ok<CustomPropertyDeletedDTO>({
      blockId: request.blockId,
      workspaceId: request.workspaceId,
      propertyId: request.propertyId,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error('[deleteCustomPropertyAction] Internal error:', {
      userId: user.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to delete property'
    );
  }
}
