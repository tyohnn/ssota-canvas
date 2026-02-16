import { z } from 'zod';

import { PropertyType } from '../../value-objects/block-properties/common-types';
import { BlockSlugSchema } from './block.requests';

const PropertyValidationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  })
  .optional();

const PropertyOptionSchema = z.object({
  id: z.string().min(1, 'Invalid option ID').optional(),
  label: z.string().min(1, 'Invalid option label'),
  value: z.string().min(1).optional(),
  color: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  disabled: z.boolean().optional(),
  description: z.string().optional(),
});

export const CreateCustomPropertyRequestSchema = z.object({
  blockId: BlockSlugSchema,
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
  id: z.string().optional(),
  name: z.string().min(1, 'Invalid property name'),
  type: z.nativeEnum(PropertyType),
  options: z.array(PropertyOptionSchema).optional(),
  order: z.number().int().nonnegative().optional(),
  visible: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  icon: z.string().nullable().optional(),
  validation: PropertyValidationSchema,
});

export const UpdateCustomPropertyRequestSchema = z
  .object({
    blockId: BlockSlugSchema,
    propertyId: z.string().min(1, 'Invalid property ID'),
    workspaceId: z.uuid('Invalid workspace ID'),
    orgId: z.uuid('Invalid organization ID'),
    name: z.string().optional(),
    type: z.nativeEnum(PropertyType).optional(),
    options: z.array(PropertyOptionSchema).optional(),
    order: z.number().int().nonnegative().optional(),
    visible: z.boolean().optional(),
    required: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
    icon: z.string().nullable().optional(),
    validation: PropertyValidationSchema,
  })
  .refine(
    data =>
      data.name !== undefined ||
      data.type !== undefined ||
      data.options !== undefined ||
      data.order !== undefined ||
      data.visible !== undefined ||
      data.required !== undefined ||
      data.defaultValue !== undefined ||
      data.icon !== undefined ||
      data.validation !== undefined,
    {
      message:
        'At least one field must be provided to update a custom property',
      path: ['updates'],
    }
  );

export const DeleteCustomPropertyRequestSchema = z.object({
  blockId: BlockSlugSchema,
  propertyId: z.string().min(1, 'Invalid property ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
});

export type CreateCustomPropertyRequestInput = z.input<
  typeof CreateCustomPropertyRequestSchema
>;
export type UpdateCustomPropertyRequestInput = z.input<
  typeof UpdateCustomPropertyRequestSchema
>;
export type DeleteCustomPropertyRequestInput = z.input<
  typeof DeleteCustomPropertyRequestSchema
>;

export type CreateCustomPropertyRequest = z.output<
  typeof CreateCustomPropertyRequestSchema
>;
export type UpdateCustomPropertyRequest = z.output<
  typeof UpdateCustomPropertyRequestSchema
>;
export type DeleteCustomPropertyRequest = z.output<
  typeof DeleteCustomPropertyRequestSchema
>;
