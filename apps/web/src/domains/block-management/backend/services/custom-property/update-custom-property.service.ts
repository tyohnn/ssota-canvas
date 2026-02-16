import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { CustomPropertyDefinitionVO } from '../../../shared/value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../../shared/value-objects/property-type.vo';
import { getBlockForUpdate, mapOptions } from './helpers';
import type { UpdateCustomPropertyCommand } from './types';

export async function updateCustomProperty(
  blockRepository: IBlockRepository,
  command: UpdateCustomPropertyCommand
): Promise<{ property: CustomPropertyDefinitionVO; updatedAt: Date }> {
  const block = await getBlockForUpdate(
    blockRepository,
    command.workspaceId,
    command.blockSlug
  );

  const existingProperty = block.customProperties.find(
    prop => prop.id === command.propertyId
  );

  if (!existingProperty) {
    throw new BlockManagementError(
      'PROPERTY_NOT_FOUND',
      'Custom property not found'
    );
  }

  const nextType = command.updates.type
    ? PropertyTypeVO.fromString(command.updates.type)
    : existingProperty.type;

  const nextOptions = command.updates.options
    ? mapOptions(command.updates.options)
    : existingProperty.options;

  const nextProperty = new CustomPropertyDefinitionVO(
    existingProperty.id,
    command.updates.name ?? existingProperty.name,
    nextType,
    nextOptions,
    command.updates.order ?? existingProperty.order,
    command.updates.visible ?? existingProperty.visible,
    command.updates.required ?? existingProperty.required,
    command.updates.defaultValue !== undefined
      ? command.updates.defaultValue
      : existingProperty.defaultValue,
    command.updates.icon ?? existingProperty.icon,
    command.updates.validation ?? existingProperty.validation
  );

  block.updateCustomPropertyDefinition(existingProperty.id, nextProperty);
  await blockRepository.update(block);

  return {
    property: nextProperty,
    updatedAt: block.updatedAt,
  };
}
