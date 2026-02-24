'use server';

import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../../backend/repositories/implementations/drizzle-block.repository';
import { addCustomProperty } from '../../backend/services/custom-property';
import type { CustomPropertyMutationDTO } from '../../shared/dtos';
import {
  type CreateCustomPropertyRequest,
  CreateCustomPropertyRequestSchema,
} from '../../shared/dtos/requests';

import type { PropertyActionContext } from './secure-action';
import { withPropertySecureAction } from './secure-action';

/**
 * Custom Property 생성 Server Action
 *
 * Security: withPropertySecureAction (workspace 권한 + Block 조회 후 blockAggregate 전달)
 */
export const createCustomPropertyAction = withPropertySecureAction(
  CreateCustomPropertyRequestSchema,
  'createCustomPropertyAction',
  createCustomPropertyInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, workspaceId: req.workspaceId }),
  }
);

async function createCustomPropertyInternal(
  request: CreateCustomPropertyRequest,
  context: PropertyActionContext
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  try {
    const blockRepository = new DrizzleBlockRepository();

    const result = await addCustomProperty({
      blockAggregate: context.blockAggregate,
      blockRepository,
      property: {
        id: request.id,
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
    console.error('[createCustomPropertyInternal] Internal error:', {
      userId: context.authenticatedUser.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to create property'
    );
  }
}
