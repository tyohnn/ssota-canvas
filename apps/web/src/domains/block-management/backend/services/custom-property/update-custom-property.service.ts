import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { CustomPropertyDefinitionVO } from '../../../shared/value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../../shared/value-objects/property-type.vo';
import { mapOptions } from './helpers';
import type { UpdateCustomPropertyParams } from './types';

export async function updateCustomProperty(
  params: UpdateCustomPropertyParams
): Promise<{ property: CustomPropertyDefinitionVO; updatedAt: Date }> {
  const { blockAggregate, blockRepository, propertyId, updates } = params;
  const block = blockAggregate.getBlock();

  if (block.isDeleted()) {
    throw new BlockManagementError(
      'BLOCK_ALREADY_DELETED',
      'Cannot modify custom properties of a deleted block'
    );
  }

  const existingProperty = block.customProperties.find(
    prop => prop.id === propertyId
  );

  if (!existingProperty) {
    throw new BlockManagementError(
      'PROPERTY_NOT_FOUND',
      'Custom property not found'
    );
  }

  const nextType = updates.type
    ? PropertyTypeVO.fromString(updates.type)
    : existingProperty.type;

  const nextOptions = updates.options
    ? mapOptions(updates.options)
    : existingProperty.options;

  const nextProperty = new CustomPropertyDefinitionVO(
    existingProperty.id,
    updates.name ?? existingProperty.name,
    nextType,
    nextOptions,
    updates.order ?? existingProperty.order,
    updates.visible ?? existingProperty.visible,
    updates.required ?? existingProperty.required,
    updates.defaultValue !== undefined
      ? updates.defaultValue
      : existingProperty.defaultValue,
    updates.icon ?? existingProperty.icon,
    updates.validation ?? existingProperty.validation
  );

  block.updateCustomPropertyDefinition(existingProperty.id, nextProperty);
  await blockRepository.update(block);

  return {
    property: nextProperty,
    updatedAt: block.updatedAt,
  };
}
