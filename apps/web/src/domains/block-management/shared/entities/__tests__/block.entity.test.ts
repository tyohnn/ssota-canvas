import { describe, it, expect, beforeEach } from 'vitest';
import { Block } from '../block.entity';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { CustomPropertyDefinitionVO } from '../../value-objects/custom-property-definition.vo';
import { PropertyTypeVO } from '../../value-objects/property-type.vo';
import { PropertyOptionVO } from '../../value-objects/property-option.vo';
import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesFactory } from '../../value-objects/block-properties';
import { PropertyType } from '../../value-objects/block-properties/common-types';

describe('Block Entity', () => {
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: WorkspaceId;
  let userId: UserId;

  beforeEach(() => {
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
    userId = new UserId('550e8400-e29b-41d4-a716-446655440020');
  });

  describe('create', () => {
    it('should create a new block with default properties', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);

      expect(block.id).toBe(blockId);
      expect(block.workspaceId).toBe(workspaceId);
      expect(block.userId).toBe(userId);
      expect(block.blockType).toBe(blockType);
      expect(block.properties.toJSON()).toEqual(blockType.getDefaultProperties());
      expect(block.customProperties).toEqual([]);
      expect(block.deletedAt).toBeNull();
      expect(block.createdAt).toBeInstanceOf(Date);
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a block with initial title', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType, 'Test Video');

      expect(block.title).toBe('Test Video');
      expect(block.properties.toJSON()).toEqual(blockType.getDefaultProperties());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a block from existing data', () => {
      const properties = {};
      const customProperties: CustomPropertyDefinitionVO[] = [];
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const deletedAt = null;

      const propertiesVO = BlockPropertiesFactory.createFromJSON(blockType, properties);
      const block = Block.reconstitute(
        blockId,
        workspaceId,
        userId,
        blockType,
        'Test Block',
        propertiesVO,
        customProperties,
        createdAt,
        updatedAt,
        deletedAt
      );

      expect(block.id).toBe(blockId);
      expect(block.workspaceId).toBe(workspaceId);
      expect(block.blockType).toBe(blockType);
      expect(block.properties.toJSON()).toEqual(properties);
      expect(block.customProperties).toEqual(customProperties);
      expect(block.createdAt).toBe(createdAt);
      expect(block.updatedAt).toBe(updatedAt);
      expect(block.deletedAt).toBe(deletedAt);
    });
  });

  describe('updateBlockType', () => {
    it('should update block type and reset properties', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const newType = new BlockType('markdown');

      block.updateBlockType(newType);

      expect(block.blockType).toBe(newType);
      expect(block.properties.toJSON()).toEqual(newType.getDefaultProperties());
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when trying to update deleted block', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      block.markAsDeleted();

      expect(() => {
        block.updateBlockType(new BlockType('markdown'));
      }).toThrow(BlockManagementError);
    });
  });

  describe('addCustomPropertyDefinition', () => {
    it('should add a custom property definition', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );

      block.addCustomPropertyDefinition(customProperty);

      expect(block.customProperties).toHaveLength(1);
      expect(block.customProperties[0]?.name).toBe('Custom Field');
      expect(block.customProperties[0]?.type.value).toBe('text');
      expect(block.customProperties[0]?.visible).toBe(true);
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should add a custom property definition with options', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const options = [
        new PropertyOptionVO('opt1', 'Option 1', 'opt1', '#ff0000'),
        new PropertyOptionVO('opt2', 'Option 2', 'opt2', '#00ff00')
      ];
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Status',
        new PropertyTypeVO(PropertyType.SELECT),
        options,
        0,
        true,
        false,
        null,
        null
      );

      block.addCustomPropertyDefinition(customProperty);

      expect(block.customProperties[0]?.options).toHaveLength(2);
    });

    it('should throw error when adding property to deleted block', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      block.markAsDeleted();

      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );

      expect(() => {
        block.addCustomPropertyDefinition(customProperty);
      }).toThrow(BlockManagementError);
    });
  });

  describe('updateCustomPropertyDefinition', () => {
    it('should update an existing custom property definition', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const originalProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );
      block.addCustomPropertyDefinition(originalProperty);

      const updatedProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Updated Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        1,
        false,
        true,
        'default',
        null
      );

      block.updateCustomPropertyDefinition('prop-1', updatedProperty);

      expect(block.customProperties[0]?.name).toBe('Updated Field');
      expect(block.customProperties[0]?.order).toBe(1);
      expect(block.customProperties[0]?.visible).toBe(false);
      expect(block.customProperties[0]?.required).toBe(true);
      expect(block.customProperties[0]?.defaultValue).toBe('default');
    });

    it('should throw error when property not found', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const updatedProperty = new CustomPropertyDefinitionVO(
        'prop-unknown',
        'Updated Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );

      expect(() => {
        block.updateCustomPropertyDefinition('non-existent', updatedProperty);
      }).toThrow(BlockManagementError);
    });
  });

  describe('removeCustomPropertyDefinition', () => {
    it('should remove custom property definition', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );
      block.addCustomPropertyDefinition(customProperty);
      const propertyId = block.customProperties[0]?.id;

      block.removeCustomPropertyDefinition(propertyId!);

      expect(block.customProperties).toHaveLength(0);
    });

    it('should throw error when property not found', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);

      expect(() => {
        block.removeCustomPropertyDefinition('non-existent');
      }).toThrow(BlockManagementError);
    });
  });

  describe('properties management', () => {
    it('should update properties through BlockPropertiesVO', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      
      // Properties are managed through BlockPropertiesVO
      const newProperties = BlockPropertiesFactory.createFromJSON(blockType, {});
      block.updateProperties(newProperties);

      expect(block.properties).toBeInstanceOf(Object);
    });
  });


  describe('markAsDeleted', () => {
    it('should mark block as deleted', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);

      block.markAsDeleted();

      expect(block.isDeleted()).toBe(true);
      expect(block.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when already deleted', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      block.markAsDeleted();

      expect(() => {
        block.markAsDeleted();
      }).toThrow(BlockManagementError);
    });
  });

  describe('restore', () => {
    it('should restore deleted block', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      block.markAsDeleted();

      block.restore();

      expect(block.isDeleted()).toBe(false);
      expect(block.deletedAt).toBeNull();
    });

    it('should throw error when not deleted', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);

      expect(() => {
        block.restore();
      }).toThrow(BlockManagementError);
    });
  });

  describe('getter methods', () => {
    it('should return custom properties', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );
      block.addCustomPropertyDefinition(customProperty);

      const customProperties = block.customProperties;

      expect(customProperties).toHaveLength(1);
      expect(customProperties[0]?.name).toBe('Custom Field');
    });

    it('should return specific custom property', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );
      block.addCustomPropertyDefinition(customProperty);
      const propertyId = block.customProperties[0]?.id;

      const foundProperty = block.customProperties.find(p => p.id === propertyId);

      expect(foundProperty).toBeDefined();
      expect(foundProperty?.name).toBe('Custom Field');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const block = Block.create(blockId, workspaceId, userId, blockType);
      const customProperty = new CustomPropertyDefinitionVO(
        'prop-1',
        'Custom Field',
        new PropertyTypeVO(PropertyType.TEXT),
        [],
        0,
        true,
        false,
        null,
        null
      );
      block.addCustomPropertyDefinition(customProperty);

      const json = block.toJSON();

      expect(json.id).toBe(blockId.value);
      expect(json.workspaceId).toBe(workspaceId.value);
      expect(json.blockType).toBe(blockType.value);
      expect(json.properties).toEqual(block.properties.toJSON());
      expect(json.customProperties).toHaveLength(1);
      expect(json.createdAt).toBe(block.createdAt.toISOString());
      expect(json.updatedAt).toBe(block.updatedAt.toISOString());
      expect(json.deletedAt).toBeNull();
    });
  });
});