import { randomUUID } from 'crypto';

import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { CustomPropertyDefinitionVO } from '../../../shared/value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../../shared/value-objects/property-type.vo';
import { mapOptions } from './helpers';
import type { AddCustomPropertyParams } from './types';

export async function addCustomProperty(
  params: AddCustomPropertyParams
): Promise<{ property: CustomPropertyDefinitionVO; updatedAt: Date }> {
  const { blockAggregate, blockRepository, property: propertyInput } = params;
  const block = blockAggregate.getBlock();

  if (block.isDeleted()) {
    throw new BlockManagementError(
      'BLOCK_ALREADY_DELETED',
      'Cannot modify custom properties of a deleted block'
    );
  }

  if (block.customProperties.length >= 50) {
    throw new BlockManagementError(
      'CUSTOM_PROPERTY_LIMIT_EXCEEDED',
      'Maximum custom property limit reached'
    );
  }

  const propertyId = propertyInput.id || randomUUID();
  const propertyType = PropertyTypeVO.fromString(propertyInput.type);
  const options = mapOptions(propertyInput.options);
  const order =
    propertyInput.order !== undefined
      ? propertyInput.order
      : block.customProperties.length;
  const visible = propertyInput.visible ?? true;
  const required = propertyInput.required ?? false;
  const defaultValue =
    propertyInput.defaultValue !== undefined
      ? propertyInput.defaultValue
      : propertyType.getDefaultValue();
  const icon = propertyInput.icon ?? null;

  const property = new CustomPropertyDefinitionVO(
    propertyId,
    propertyInput.name,
    propertyType,
    options,
    order,
    visible,
    required,
    defaultValue,
    icon,
    propertyInput.validation
  );

  block.addCustomPropertyDefinition(property);
  await blockRepository.update(block);

  return {
    property,
    updatedAt: block.updatedAt,
  };
}
