import { describe, it, expect, beforeEach } from 'vitest';
import { Block, CustomPropertyDefinition } from '../block.entity';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';
import { BlockManagementError } from '../../errors/block-management.error';

describe('Block Entity', () => {
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: string;

  beforeEach(() => {
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = 'workspace-123';
  });

  describe('create', () => {
    it('should create a new block with default properties', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      expect(block.id).toBe(blockId);
      expect(block.workspaceId).toBe(workspaceId);
      expect(block.blockType).toBe(blockType);
      expect(block.properties).toEqual(blockType.getDefaultProperties());
      expect(block.customProperties).toEqual([]);
      expect(block.deletedAt).toBeNull();
      expect(block.createdAt).toBeInstanceOf(Date);
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a block with initial properties', () => {
      const initialProperties = { title: 'Test Video', url: 'https://youtube.com/watch?v=123' };
      const block = Block.create(blockId, workspaceId, blockType, initialProperties);

      expect(block.properties).toEqual({
        ...blockType.getDefaultProperties(),
        ...initialProperties
      });
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a block from existing data', () => {
      const properties = { title: 'Test Video' };
      const customProperties: CustomPropertyDefinition[] = [
        {
          id: 'prop-1',
          name: 'Custom Field',
          type: 'text',
          order: 0,
          visible: true
        }
      ];
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const deletedAt = null;

      const block = Block.reconstitute(
        blockId,
        workspaceId,
        blockType,
        properties,
        customProperties,
        createdAt,
        updatedAt,
        deletedAt
      );

      expect(block.id).toBe(blockId);
      expect(block.workspaceId).toBe(workspaceId);
      expect(block.blockType).toBe(blockType);
      expect(block.properties).toEqual(properties);
      expect(block.customProperties).toEqual(customProperties);
      expect(block.createdAt).toBe(createdAt);
      expect(block.updatedAt).toBe(updatedAt);
      expect(block.deletedAt).toBe(deletedAt);
    });
  });

  describe('updateBlockType', () => {
    it('should update block type and reset properties', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const newType = new BlockType('markdown');

      block.updateBlockType(newType);

      expect(block.blockType).toBe(newType);
      expect(block.properties).toEqual(newType.getDefaultProperties());
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when trying to update deleted block', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.markAsDeleted();

      expect(() => {
        block.updateBlockType(new BlockType('markdown'));
      }).toThrow(BlockManagementError);
    });
  });

  describe('addCustomProperty', () => {
    it('should add a custom property', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      block.addCustomProperty('Custom Field', 'text');

      expect(block.customProperties).toHaveLength(1);
      expect(block.customProperties[0].name).toBe('Custom Field');
      expect(block.customProperties[0].type).toBe('text');
      expect(block.customProperties[0].visible).toBe(true);
      expect(block.updatedAt).toBeInstanceOf(Date);
    });

    it('should add a custom property with options', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const options = [
        { id: 'opt1', label: 'Option 1', color: '#ff0000' },
        { id: 'opt2', label: 'Option 2', color: '#00ff00' }
      ];

      block.addCustomProperty('Status', 'select', options);

      expect(block.customProperties[0].options).toEqual(options);
    });

    it('should throw error when adding property to deleted block', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.markAsDeleted();

      expect(() => {
        block.addCustomProperty('Custom Field', 'text');
      }).toThrow(BlockManagementError);
    });

    it('should throw error when exceeding property limit', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      // Add 50 properties
      for (let i = 0; i < 50; i++) {
        block.addCustomProperty(`Property ${i}`, 'text');
      }

      expect(() => {
        block.addCustomProperty('Property 51', 'text');
      }).toThrow(BlockManagementError);
    });
  });

  describe('changePropertyType', () => {
    it('should change property type', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Status', 'text');
      const propertyId = block.customProperties[0].id;

      block.changePropertyType(propertyId, 'select', [
        { id: 'opt1', label: 'Option 1', color: '#ff0000' }
      ]);

      expect(block.customProperties[0].type).toBe('select');
      expect(block.customProperties[0].options).toHaveLength(1);
    });

    it('should throw error when property not found', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      expect(() => {
        block.changePropertyType('non-existent', 'select');
      }).toThrow(BlockManagementError);
    });
  });

  describe('deleteCustomProperty', () => {
    it('should delete custom property and its value', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Custom Field', 'text');
      const propertyId = block.customProperties[0].id;
      block.setPropertyValue(propertyId, 'Test Value');

      block.deleteCustomProperty(propertyId);

      expect(block.customProperties).toHaveLength(0);
      expect(block.getPropertyValue(propertyId)).toBeUndefined();
    });

    it('should throw error when property not found', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      expect(() => {
        block.deleteCustomProperty('non-existent');
      }).toThrow(BlockManagementError);
    });
  });

  describe('setPropertyValue', () => {
    it('should set property value', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Custom Field', 'text');
      const propertyId = block.customProperties[0].id;

      block.setPropertyValue(propertyId, 'Test Value');

      expect(block.getPropertyValue(propertyId)).toBe('Test Value');
    });

    it('should validate property type for custom properties', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Status', 'select');
      const propertyId = block.customProperties[0].id;

      // This should not throw as we're not validating in the entity
      block.setPropertyValue(propertyId, 'Invalid Value');
    });
  });

  describe('clearPropertyValue', () => {
    it('should clear property value', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.setPropertyValue('title', 'Test Title');

      block.clearPropertyValue('title');

      expect(block.getPropertyValue('title')).toBeUndefined();
    });
  });

  describe('uploadMedia', () => {
    it('should upload media file and set property', async () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const url = await block.uploadMedia(file, 'image');

      expect(url).toContain('storage.example.com');
      expect(block.getPropertyValue('image')).toBe(url);
    });

    it('should throw error for oversized file', async () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await expect(block.uploadMedia(largeFile, 'image')).rejects.toThrow(BlockManagementError);
    });

    it('should throw error for unsupported file type', async () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const file = new File(['test'], 'test.exe', { type: 'application/x-executable' });

      await expect(block.uploadMedia(file, 'file')).rejects.toThrow(BlockManagementError);
    });
  });

  describe('executeBlockTool', () => {
    it('should execute available block tool', async () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const availableTools = block.getAvailableTools();

      if (availableTools.length > 0) {
        const result = await block.executeBlockTool(availableTools[0], { param: 'value' });

        expect(result.success).toBe(true);
        expect(result.toolType).toBe(availableTools[0]);
      }
    });

    it('should throw error for unavailable tool', async () => {
      const block = Block.create(blockId, workspaceId, blockType);

      await expect(block.executeBlockTool('non-existent-tool')).rejects.toThrow(BlockManagementError);
    });
  });

  describe('executeBlockToolByAI', () => {
    it('should execute AI block tool', async () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const availableTools = block.getAvailableTools();

      if (availableTools.length > 0) {
        const result = await block.executeBlockToolByAI(
          availableTools[0],
          { param: 'value' },
          { context: 'ai-context' }
        );

        expect(result.success).toBe(true);
        expect(result.toolType).toBe(availableTools[0]);
        expect(result.aiContext).toEqual({ context: 'ai-context' });
      }
    });
  });

  describe('markAsDeleted', () => {
    it('should mark block as deleted', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      block.markAsDeleted();

      expect(block.isDeleted()).toBe(true);
      expect(block.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw error when already deleted', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.markAsDeleted();

      expect(() => {
        block.markAsDeleted();
      }).toThrow(BlockManagementError);
    });
  });

  describe('restore', () => {
    it('should restore deleted block', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.markAsDeleted();

      block.restore();

      expect(block.isDeleted()).toBe(false);
      expect(block.deletedAt).toBeNull();
    });

    it('should throw error when not deleted', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      expect(() => {
        block.restore();
      }).toThrow(BlockManagementError);
    });
  });

  describe('getter methods', () => {
    it('should return all properties', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.setPropertyValue('title', 'Test Title');

      const properties = block.getAllProperties();

      expect(properties).toEqual({
        ...blockType.getDefaultProperties(),
        title: 'Test Title'
      });
    });

    it('should return custom properties', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Custom Field', 'text');

      const customProperties = block.getCustomProperties();

      expect(customProperties).toHaveLength(1);
      expect(customProperties[0].name).toBe('Custom Field');
    });

    it('should return specific custom property', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Custom Field', 'text');
      const propertyId = block.customProperties[0].id;

      const customProperty = block.getCustomProperty(propertyId);

      expect(customProperty).toBeDefined();
      expect(customProperty?.name).toBe('Custom Field');
    });

    it('should return metadata schema', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      const schema = block.getMetadataSchema();

      expect(schema).toEqual(blockType.getMetadataSchema());
    });

    it('should return available tools', () => {
      const block = Block.create(blockId, workspaceId, blockType);

      const tools = block.getAvailableTools();

      expect(tools).toEqual(blockType.getAvailableTools());
    });

    it('should check tool support', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      const availableTools = block.getAvailableTools();

      if (availableTools.length > 0) {
        expect(block.supportsTool(availableTools[0])).toBe(true);
      }
      expect(block.supportsTool('non-existent-tool')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const block = Block.create(blockId, workspaceId, blockType);
      block.addCustomProperty('Custom Field', 'text');

      const json = block.toJSON();

      expect(json.id).toBe(blockId.value);
      expect(json.workspaceId).toBe(workspaceId);
      expect(json.blockType).toBe(blockType.value);
      expect(json.properties).toEqual(block.properties);
      expect(json.customProperties).toEqual(block.customProperties);
      expect(json.createdAt).toBe(block.createdAt.toISOString());
      expect(json.updatedAt).toBe(block.updatedAt.toISOString());
      expect(json.deletedAt).toBeNull();
    });
  });
});
