import { describe, it, expect } from 'vitest';
import { WorkspaceId } from '../workspace-id.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('WorkspaceId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const workspaceId = new WorkspaceId(validUuid);

      // Then
      expect(workspaceId.value).toBe(validUuid);
      expect(workspaceId.toString()).toBe(validUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'invalid-uuid-format';

      // When & Then
      expect(() => new WorkspaceId(invalidUuid)).toThrow(
        WorkspaceManagementError
      );
      expect(() => new WorkspaceId(invalidUuid)).toThrow(
        'Invalid workspace ID format'
      );
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new WorkspaceId(emptyString)).toThrow(
        WorkspaceManagementError
      );
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new WorkspaceId(null as any)).toThrow(
        WorkspaceManagementError
      );
      expect(() => new WorkspaceId(undefined as any)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new WorkspaceId(uuid);
      const id2 = new WorkspaceId(uuid);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
      const id2 = new WorkspaceId('660e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

