import { describe, it, expect } from 'vitest';
import { PageId } from '../page-id.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('PageId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '660e8400-e29b-41d4-a716-446655440000';

      // When
      const pageId = new PageId(validUuid);

      // Then
      expect(pageId.value).toBe(validUuid);
      expect(pageId.toString()).toBe(validUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'not-a-uuid';

      // When & Then
      expect(() => new PageId(invalidUuid)).toThrow(WorkspaceManagementError);
      expect(() => new PageId(invalidUuid)).toThrow(
        'Invalid page ID format'
      );
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new PageId(emptyString)).toThrow(WorkspaceManagementError);
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new PageId(null as any)).toThrow(WorkspaceManagementError);
      expect(() => new PageId(undefined as any)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const uuid = '660e8400-e29b-41d4-a716-446655440000';
      const id1 = new PageId(uuid);
      const id2 = new PageId(uuid);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new PageId('660e8400-e29b-41d4-a716-446655440000');
      const id2 = new PageId('770e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

