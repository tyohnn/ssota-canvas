import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSchemaFieldEditor } from '../../hooks/use-schema-field-editor';

// Mock Server Actions
const mockCreateCustomPropertyAction = vi.fn();
const mockUpdateCustomPropertyAction = vi.fn();

vi.mock('../../actions/property.actions', () => ({
  createCustomPropertyAction: mockCreateCustomPropertyAction,
  updateCustomPropertyAction: mockUpdateCustomPropertyAction,
}));

// Mock React Flow hooks
const mockGetNode = vi.fn();
const mockUpdateNode = vi.fn();

vi.mock('reactflow', () => ({
  useReactFlow: () => ({
    getNode: mockGetNode,
    updateNode: mockUpdateNode,
  }),
}));

describe('useSchemaFieldEditor', () => {
  const mockBlockId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPropertyId = '123e4567-e89b-12d3-a456-426614174002';

  const mockNode = {
    id: mockBlockId,
    data: {
      properties: {
        title: 'Test Title',
      },
      customProperties: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNode.mockReturnValue(mockNode);
    mockCreateCustomPropertyAction.mockResolvedValue({
      success: true,
      data: {
        id: mockPropertyId,
        workspaceId: 'workspace-123',
        name: 'Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    mockUpdateCustomPropertyAction.mockResolvedValue({
      success: true,
      data: {
        id: mockPropertyId,
        workspaceId: 'workspace-123',
        name: 'Updated Priority',
        propertyType: 'select',
        options: [
          { id: '1', label: 'High', color: '#ff0000', order: 1 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  describe('initialization', () => {
    it('should initialize with correct interface', () => {
      const { result } = renderHook(() => useSchemaFieldEditor());

      expect(result.current.saveLabel).toBeDefined();
      expect(result.current.deleteField).toBeDefined();
      expect(result.current.duplicateField).toBeDefined();
      expect(result.current.commitOptions).toBeDefined();
    });
  });

  describe('saveLabel', () => {
    it('should save label successfully', async () => {
      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.saveLabel(mockBlockId, mockPropertyId, 'Priority');
      });

      expect(mockCreateCustomPropertyAction).toHaveBeenCalled();
    });

    it('should handle save failure', async () => {
      mockCreateCustomPropertyAction.mockResolvedValue({
        success: false,
        error: 'Save failed',
      });

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.saveLabel(mockBlockId, mockPropertyId, 'Priority');
      });

      expect(mockCreateCustomPropertyAction).toHaveBeenCalled();
    });
  });

  describe('deleteField', () => {
    it('should delete field successfully', async () => {
      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.deleteField(mockBlockId, mockPropertyId);
      });

      expect(mockUpdateCustomPropertyAction).toHaveBeenCalled();
    });

    it('should handle delete failure', async () => {
      mockUpdateCustomPropertyAction.mockResolvedValue({
        success: false,
        error: 'Delete failed',
      });

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.deleteField(mockBlockId, mockPropertyId);
      });

      expect(mockUpdateCustomPropertyAction).toHaveBeenCalled();
    });
  });

  describe('duplicateField', () => {
    it('should duplicate field successfully', async () => {
      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.duplicateField(mockBlockId, mockPropertyId);
      });

      expect(mockCreateCustomPropertyAction).toHaveBeenCalled();
    });

    it('should handle duplicate failure', async () => {
      mockCreateCustomPropertyAction.mockResolvedValue({
        success: false,
        error: 'Duplicate failed',
      });

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.duplicateField(mockBlockId, mockPropertyId);
      });

      expect(mockCreateCustomPropertyAction).toHaveBeenCalled();
    });
  });

  describe('commitOptions', () => {
    it('should commit options successfully', async () => {
      const { result } = renderHook(() => useSchemaFieldEditor());

      const options = [
        { id: '1', label: 'High', color: '#ff0000', order: 1 },
        { id: '2', label: 'Medium', color: '#ffff00', order: 2 },
      ];

      await act(async () => {
        await result.current.commitOptions(mockBlockId, mockPropertyId, options);
      });

      expect(mockUpdateCustomPropertyAction).toHaveBeenCalled();
    });

    it('should handle commit failure', async () => {
      mockUpdateCustomPropertyAction.mockResolvedValue({
        success: false,
        error: 'Commit failed',
      });

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.commitOptions(mockBlockId, mockPropertyId, []);
      });

      expect(mockUpdateCustomPropertyAction).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockCreateCustomPropertyAction.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.saveLabel(mockBlockId, mockPropertyId, 'Priority');
      });

      expect(mockCreateCustomPropertyAction).toHaveBeenCalled();
    });

    it('should handle missing node gracefully', async () => {
      mockGetNode.mockReturnValue(null);

      const { result } = renderHook(() => useSchemaFieldEditor());

      await act(async () => {
        await result.current.saveLabel(mockBlockId, mockPropertyId, 'Priority');
      });

      // Should not call action when node is not found
      expect(mockCreateCustomPropertyAction).not.toHaveBeenCalled();
    });
  });
});