import { randomUUID } from 'crypto';

import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { CustomPropertyDefinitionVO } from '../../../shared/value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../../shared/value-objects/property-type.vo';
import { getBlockForUpdate, mapOptions } from './helpers';
import type { AddCustomPropertyCommand } from './types';

export async function addCustomProperty(
  blockRepository: IBlockRepository,
  command: AddCustomPropertyCommand
): Promise<{ property: CustomPropertyDefinitionVO; updatedAt: Date }> {
  const block = await getBlockForUpdate(
    blockRepository,
    command.workspaceId,
    command.blockSlug
  );

  if (block.customProperties.length >= 50) {
    throw new BlockManagementError(
      'CUSTOM_PROPERTY_LIMIT_EXCEEDED',
      'Maximum custom property limit reached'
    );
  }

  const propertyId = command.property.id || randomUUID();
  const propertyType = PropertyTypeVO.fromString(command.property.type);
  const options = mapOptions(command.property.options);
  const order =
    command.property.order !== undefined
      ? command.property.order
      : block.customProperties.length;
  const visible = command.property.visible ?? true;
  const required = command.property.required ?? false;
  const defaultValue =
    command.property.defaultValue !== undefined
      ? command.property.defaultValue
      : propertyType.getDefaultValue();
  const icon = command.property.icon ?? null;

  const property = new CustomPropertyDefinitionVO(
    propertyId,
    command.property.name,
    propertyType,
    options,
    order,
    visible,
    required,
    defaultValue,
    icon,
    command.property.validation
  );

  block.addCustomPropertyDefinition(property);
  await blockRepository.update(block);

  return {
    property,
    updatedAt: block.updatedAt,
  };
}
