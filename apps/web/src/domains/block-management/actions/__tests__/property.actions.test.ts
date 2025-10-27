import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCustomPropertyAction,
  updateCustomPropertyAction,
  deleteCustomPropertyAction,
  getCustomPropertiesAction,
} from '../property.actions';
import type { ManageCustomPropertyRequest } from '../../shared/types';

// Mock Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock repository
const mockPropertyRepository = {
  createCustomPropertyDefinition: vi.fn(),
  updateCustomPropertyDefinition: vi.fn(),
  deleteCustomPropertyDefinition: vi.fn(),
  getCustomPropertyDefinitions: vi.fn(),
};

vi.mock('../../backend/repositories/implementations/drizzle-property.repository', () => ({
  DrizzlePropertyRepository: vi.fn().mockImplementation(() => mockPropertyRepository),
}));

describe('Property Actions', () => {
  let blockId: string;
  let workspaceId: string;
  let propertyId: string;

  beforeEach(() => {
    blockId = '123e4567-e89b-12d3-a456-426614174000';
    workspaceId = '123e4567-e89b-12d3-a456-426614174001';
    propertyId = '123e4567-e89b-12d3-a456-426614174002';
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createCustomPropertyAction', () => {
    it('should create a custom property successfully', async () => {
      const mockProperty = {
        id: propertyId,
        workspaceId,
        name: 'Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
          { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
          { id: '3', label: 'Low', color: '#00ff00', order: 3 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPropertyRepository.createCustomPropertyDefinition.mockResolvedValue(mockProperty);

      const result = await createCustomPropertyAction({
        action: 'add',
        blockId,
        workspaceId,
        name: 'Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
          { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
          { id: '3', label: 'Low', color: '#00ff00', order: 3 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProperty);
      expect(mockPropertyRepository.createCustomPropertyDefinition).toHaveBeenCalledWith(
        blockId,
        {
          workspaceId,
          name: 'Priority',
          propertyType: 'select',
          options: [
            { id: '1', label: 'High', color: '#ff0000', order: 1 },
            { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
            { id: '3', label: 'Low', color: '#00ff00', order: 3 },
          ],
        }
      );
    });

    it('should return error when validation fails', async () => {
      const result = await createCustomPropertyAction({
        action: 'add',
        blockId: 'invalid-uuid',
        workspaceId: 'invalid-uuid',
        name: 'Priority',
        propertyType: 'select',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid uuid');
    });

    it('should return error when repository fails', async () => {
      mockPropertyRepository.createCustomPropertyDefinition.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await createCustomPropertyAction({
        action: 'add',
        blockId,
        workspaceId,
        name: 'Priority',
        propertyType: 'select',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });

  describe('updateCustomPropertyAction', () => {
    it('should update a custom property successfully', async () => {
      const mockProperty = {
        id: propertyId,
        workspaceId,
        name: 'Updated Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
          { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPropertyRepository.updateCustomPropertyDefinition.mockResolvedValue(mockProperty);

      const result = await updateCustomPropertyAction(propertyId, {
        name: 'Updated Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
          { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProperty);
      expect(mockPropertyRepository.updateCustomPropertyDefinition).toHaveBeenCalledWith(
        propertyId,
        {
          name: 'Updated Priority',
          propertyType: 'select',
          options: [
            { id: '1', label: 'High', color: '#ff0000', order: 1 },
            { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
          ],
        }
      );
    });

    it('should return error when repository fails', async () => {
      mockPropertyRepository.updateCustomPropertyDefinition.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await updateCustomPropertyAction(propertyId, {
        name: 'Updated Priority',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });

  describe('deleteCustomPropertyAction', () => {
    it('should delete a custom property successfully', async () => {
      mockPropertyRepository.deleteCustomPropertyDefinition.mockResolvedValue(undefined);

      const result = await deleteCustomPropertyAction(propertyId);

      expect(result.success).toBe(true);
      expect(mockPropertyRepository.deleteCustomPropertyDefinition).toHaveBeenCalledWith(propertyId);
    });

    it('should return error when repository fails', async () => {
      mockPropertyRepository.deleteCustomPropertyDefinition.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await deleteCustomPropertyAction(propertyId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });

  describe('getCustomPropertiesAction', () => {
    it('should get custom properties successfully', async () => {
      const mockProperties = [
        {
          id: propertyId,
          workspaceId,
          name: 'Priority',
          propertyType: 'select',
          options: [
            { id: '1', label: 'High', color: '#ff0000', order: 1 },
            { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      mockPropertyRepository.getCustomPropertyDefinitions.mockResolvedValue(mockProperties);

      const result = await getCustomPropertiesAction(workspaceId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProperties);
      expect(mockPropertyRepository.getCustomPropertyDefinitions).toHaveBeenCalledWith(workspaceId);
    });

    it('should return error when repository fails', async () => {
      mockPropertyRepository.getCustomPropertyDefinitions.mockRejectedValue(
        new Error('Repository error')
      );

      const result = await getCustomPropertiesAction(workspaceId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Repository error');
    });
  });
});
