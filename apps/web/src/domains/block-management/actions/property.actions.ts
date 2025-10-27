'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DrizzlePropertyRepository } from '../backend/repositories/implementations/drizzle-property.repository';
import type {
  ManageCustomPropertyRequest,
  CustomPropertyDefinition,
  PropertyOption,
} from '../shared/types';

const ManageCustomPropertySchema = z.object({
  workspaceId: z.string().uuid(),
  propertyType: z.enum([
    'text',
    'number',
    'select',
    'multiSelect',
    'date',
    'checkbox',
    'status',
  ]),
  name: z.string().min(1),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        color: z.string().optional(),
        order: z.number(),
      })
    )
    .optional(),
});

export async function createCustomPropertyAction(
  data: ManageCustomPropertyRequest
): Promise<{
  success: boolean;
  data?: CustomPropertyDefinition;
  error?: string;
}> {
  try {
    const validatedData = ManageCustomPropertySchema.parse(data);
    const repository = new DrizzlePropertyRepository();

    const property = await repository.createCustomPropertyDefinition(
      data.blockId!,
      {
        workspaceId: data.workspaceId!,
        name: data.name!,
        propertyType: data.propertyType!,
        options: data.options,
      }
    );

    revalidatePath(`/workspace/${validatedData.workspaceId}/settings`);

    return {
      success: true,
      data: property,
    };
  } catch (error) {
    console.error('Failed to create custom property:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create custom property',
    };
  }
}

export async function updateCustomPropertyAction(
  propertyId: string,
  data: Partial<ManageCustomPropertyRequest>
): Promise<{
  success: boolean;
  data?: CustomPropertyDefinition;
  error?: string;
}> {
  try {
    const validatedData = ManageCustomPropertySchema.partial().parse(data);
    const repository = new DrizzlePropertyRepository();

    const property = await repository.updateCustomPropertyDefinition(
      propertyId,
      validatedData
    );

    revalidatePath(`/workspace/${data.workspaceId}/settings`);

    return {
      success: true,
      data: property,
    };
  } catch (error) {
    console.error('Failed to update custom property:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update custom property',
    };
  }
}

export async function deleteCustomPropertyAction(propertyId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const repository = new DrizzlePropertyRepository();
    await repository.deleteCustomPropertyDefinition(propertyId);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete custom property:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete custom property',
    };
  }
}

export async function getCustomPropertiesAction(workspaceId: string): Promise<{
  success: boolean;
  data?: CustomPropertyDefinition[];
  error?: string;
}> {
  try {
    const repository = new DrizzlePropertyRepository();
    const properties =
      await repository.getCustomPropertyDefinitions(workspaceId);

    return {
      success: true,
      data: properties,
    };
  } catch (error) {
    console.error('Failed to get custom properties:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get custom properties',
    };
  }
}
