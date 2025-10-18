import { describe, it, expect } from 'vitest';
import { WorkspaceInvitationId } from '../workspace-invitation-id.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('WorkspaceInvitationId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const invitationId = new WorkspaceInvitationId(validUuid);

      // Then
      expect(invitationId.value).toBe(validUuid);
      expect(invitationId.toString()).toBe(validUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'invalid-uuid-format';

      // When & Then
      expect(() => new WorkspaceInvitationId(invalidUuid)).toThrow(
        WorkspaceManagementError
      );
      expect(() => new WorkspaceInvitationId(invalidUuid)).toThrow(
        'Invalid workspace invitation ID format'
      );
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new WorkspaceInvitationId(emptyString)).toThrow(
        WorkspaceManagementError
      );
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new WorkspaceInvitationId(null as any)).toThrow(
        WorkspaceManagementError
      );
      expect(() => new WorkspaceInvitationId(undefined as any)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new WorkspaceInvitationId(uuid);
      const id2 = new WorkspaceInvitationId(uuid);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new WorkspaceInvitationId(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      const id2 = new WorkspaceInvitationId(
        '660e8400-e29b-41d4-a716-446655440000'
      );

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

