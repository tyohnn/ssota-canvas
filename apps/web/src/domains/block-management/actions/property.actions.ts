'use server';

import { getAuthErrorMessage } from '@/domains/common/auth/error';
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  verifyAccess,
} from '@/domains/common/auth/helpers';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockRepository } from '../backend/repositories/implementations/drizzle-block.repository';
import { BlockCustomPropertyService } from '../backend/services/block-custom-property.service';
import {
  type CustomPropertyDeletedDTO,
  type CustomPropertyMutationDTO,
} from '../shared/dtos';
import {
  type CreateCustomPropertyRequest,
  CreateCustomPropertyRequestSchema,
  type DeleteCustomPropertyRequest,
  DeleteCustomPropertyRequestSchema,
  type UpdateCustomPropertyRequest,
  UpdateCustomPropertyRequestSchema,
} from '../shared/dtos/requests';
import { BlockId } from '../shared/value-objects/block-id.vo';

export async function createCustomPropertyAction(
  request: unknown
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  const parseResult = CreateCustomPropertyRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to createCustomPropertyAction',
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

    return await createCustomPropertyInternal(validatedRequest, user);
  } catch (error) {
    console.error('[createCustomPropertyAction] Failed to create property', {
      error,
    });

    return err(
      error instanceof Error ? error.message : 'Failed to create property'
    );
  }
}

export async function updateCustomPropertyAction(
  request: unknown
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  const parseResult = UpdateCustomPropertyRequestSchema.safeParse(request);

  if (!parseResult.success) {
    console.warn(
      '[Security] Invalid request to updateCustomPropertyAction',
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

    return await updateCustomPropertyInternal(validatedRequest, user);
  } catch (error) {
    console.error('[updateCustomPropertyAction] Failed to update property', {
      error,
    });

    return err(
      error instanceof Error ? error.message : 'Failed to update property'
    );
  }
}

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

async function createCustomPropertyInternal(
  request: CreateCustomPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  try {
    const repository = new DrizzleBlockRepository();
    const service = new BlockCustomPropertyService(repository);

    const result = await service.addCustomProperty({
      blockId: new BlockId(request.blockId),
      workspaceId: request.workspaceId,
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
    console.error('[createCustomPropertyAction] Internal error:', {
      userId: user.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to create property'
    );
  }
}

async function updateCustomPropertyInternal(
  request: UpdateCustomPropertyRequest,
  user: AuthenticatedUser
): Promise<ActionResult<CustomPropertyMutationDTO>> {
  try {
    const repository = new DrizzleBlockRepository();
    const service = new BlockCustomPropertyService(repository);

    const result = await service.updateCustomProperty({
      blockId: new BlockId(request.blockId),
      workspaceId: request.workspaceId,
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
    console.error('[updateCustomPropertyAction] Internal error:', {
      userId: user.id,
      error,
    });
    return err(
      error instanceof Error ? error.message : 'Failed to update property'
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
      blockId: new BlockId(request.blockId),
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
