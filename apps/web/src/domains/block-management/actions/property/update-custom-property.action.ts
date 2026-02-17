'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { updateCustomProperty } from '../../backend/services/custom-property';
import type { CustomPropertyMutationDTO } from '../../shared/dtos';
import {
  type UpdateCustomPropertyRequest,
  UpdateCustomPropertyRequestSchema,
} from '../../shared/dtos/requests';

import type { PropertyActionContext } from './secure-action';
import { withPropertySecureAction } from './secure-action';

/**
 * Custom Property 수정 Server Action
 *
 * Security: withPropertySecureAction (workspace 권한 + Block 조회 후 blockAggregate 전달)
 */
export const updateCustomPropertyAction = withPropertySecureAction(
  UpdateCustomPropertyRequestSchema,
  'updateCustomPropertyAction',
  updateCustomPropertyInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, propertyId: req.propertyId }),
  }
);

async function updateCustomPropertyInternal(
  request: UpdateCustomPropertyRequest,
  context: PropertyActionContext
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  try {
    const blockRepository = new DrizzleBlockRepository();

    const result = await updateCustomProperty({
      blockAggregate: context.blockAggregate,
      blockRepository,
      propertyId: request.propertyId,
      updates: {
        name: request.name,
        type: request.type,
        options: request.options,
        order: request.order,
        visible: request.visible,
        required: request.required,
        defaultValue: request.defaultValue,
        icon: request.icon,
        validation: request.validation,
      },
    });

    return ok<CustomPropertyMutationDTO>({
      blockId: request.blockId,
      workspaceId: request.workspaceId,
      property: result.property.toJSON(),
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error('[updateCustomPropertyInternal] Internal error:', {
      userId: context.authenticatedUser.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to update property'
    );
  }
}
