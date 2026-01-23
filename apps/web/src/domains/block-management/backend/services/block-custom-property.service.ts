import { randomUUID } from 'crypto';

import { IBlockRepository } from '../repositories/interfaces/block.repository.interface';
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockManagementError } from '../../shared/errors/block-management.error';
import { CustomPropertyDefinitionVO } from '../../shared/value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../shared/value-objects/property-type.vo';
import { PropertyOptionVO } from '../../shared/value-objects/property-option.vo';

type PropertyOptionInput = {
  id?: string;
  label: string;
  value?: string;
  color?: string;
  order?: number;
  disabled?: boolean;
  description?: string;
};

type PropertyValidationInput = {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
};

interface AddCustomPropertyCommand {
  blockId: BlockId;
  workspaceId: string;
  property: {
    id?: string;
    name: string;
    type: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
}

interface UpdateCustomPropertyCommand {
  blockId: BlockId;
  workspaceId: string;
  propertyId: string;
  updates: {
    name?: string;
    type?: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
}

interface DeleteCustomPropertyCommand {
  blockId: BlockId;
  workspaceId: string;
  propertyId: string;
}

export class BlockCustomPropertyService {
  constructor(private readonly blockRepository: IBlockRepository) {}

  async addCustomProperty(command: AddCustomPropertyCommand): Promise<{
    property: CustomPropertyDefinitionVO;
    updatedAt: Date;
  }> {
    const block = await this.getBlockForUpdate(
      command.blockId,
      command.workspaceId
    );

    if (block.customProperties.length >= 50) {
      throw new BlockManagementError(
        'CUSTOM_PROPERTY_LIMIT_EXCEEDED',
        'Maximum custom property limit reached'
      );
    }

    const propertyId = command.property.id || randomUUID();
    const propertyType = PropertyTypeVO.fromString(command.property.type);
    const options = this.mapOptions(command.property.options);
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
    await this.blockRepository.update(block);

    return {
      property,
      updatedAt: block.updatedAt,
    };
  }

  async updateCustomProperty(command: UpdateCustomPropertyCommand): Promise<{
    property: CustomPropertyDefinitionVO;
    updatedAt: Date;
  }> {
    const block = await this.getBlockForUpdate(
      command.blockId,
      command.workspaceId
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
      ? this.mapOptions(command.updates.options)
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
    await this.blockRepository.update(block);

    return {
      property: nextProperty,
      updatedAt: block.updatedAt,
    };
  }

  async deleteCustomProperty(command: DeleteCustomPropertyCommand): Promise<{
    updatedAt: Date;
  }> {
    const block = await this.getBlockForUpdate(
      command.blockId,
      command.workspaceId
    );

    block.removeCustomPropertyDefinition(command.propertyId);
    await this.blockRepository.update(block);

    return {
      updatedAt: block.updatedAt,
    };
  }

  private async getBlockForUpdate(blockId: BlockId, workspaceId: string) {
    const block = await this.blockRepository.findById(blockId);

    if (!block) {
      throw new BlockManagementError(
        'BLOCK_NOT_FOUND',
        'Block not found for custom property operation'
      );
    }

    if (block.workspaceId.value !== workspaceId) {
      throw new BlockManagementError(
        'WORKSPACE_MISMATCH',
        'Block does not belong to the provided workspace'
      );
    }

    if (block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify custom properties of a deleted block'
      );
    }

    return block;
  }

  private mapOptions(options?: PropertyOptionInput[]): PropertyOptionVO[] {
    if (!options || options.length === 0) {
      return [];
    }

    return options.map(option =>
      PropertyOptionVO.fromJSON({
        id: option.id ?? randomUUID(),
        label: option.label,
        value: option.value ?? option.id ?? option.label,
        color: option.color,
        order: option.order ?? 0,
        disabled: option.disabled ?? false,
        description: option.description,
      })
    );
  }
}
