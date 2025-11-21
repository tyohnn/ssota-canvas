import { describe, it, expect } from 'vitest';
import { UserId, OrganizationId } from '../ids.vo';
import { UserManagementError } from '../../errors/user-management.error';

describe('UserId', () => {
  describe('생성자', () => {
    it('유효한 사용자 ID로 생성되어야 한다', () => {
      // Given
      const validId = 'user_123456789';

      // When
      const userId = new UserId(validId);

      // Then
      expect(userId.value).toBe(validId);
    });

    it('UUID 형식의 ID를 처리해야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const userId = new UserId(uuid);

      // Then
      expect(userId.value).toBe(uuid);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyId = '';

      // When & Then
      expect(() => new UserId(emptyId)).toThrow(UserManagementError);
      expect(() => new UserId(emptyId)).toThrow('User ID cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const whitespaceId = '   ';

      // When & Then
      expect(() => new UserId(whitespaceId)).toThrow(UserManagementError);
      expect(() => new UserId(whitespaceId)).toThrow('User ID cannot be empty');
    });

    it('null이나 undefined에 대해 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(() => new UserId(null as any)).toThrow(UserManagementError);
      expect(() => new UserId(undefined as any)).toThrow(UserManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const id1 = new UserId('user_123');
      const id2 = new UserId('user_123');

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new UserId('user_123');
      const id2 = new UserId('user_456');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

describe('OrganizationId', () => {
  describe('생성자', () => {
    it('유효한 조직 ID로 생성되어야 한다', () => {
      // Given
      const validId = 'org_123456789';

      // When
      const organizationId = new OrganizationId(validId);

      // Then
      expect(organizationId.value).toBe(validId);
    });

    it('UUID 형식의 ID를 처리해야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440001';

      // When
      const organizationId = new OrganizationId(uuid);

      // Then
      expect(organizationId.value).toBe(uuid);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyId = '';

      // When & Then
      expect(() => new OrganizationId(emptyId)).toThrow(UserManagementError);
      expect(() => new OrganizationId(emptyId)).toThrow('Organization ID cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const whitespaceId = '   ';

      // When & Then
      expect(() => new OrganizationId(whitespaceId)).toThrow(UserManagementError);
      expect(() => new OrganizationId(whitespaceId)).toThrow('Organization ID cannot be empty');
    });
  });

  describe('generate', () => {
    it('새로운 UUID를 생성해야 한다', () => {
      // When
      const organizationId1 = OrganizationId.generate();
      const organizationId2 = OrganizationId.generate();

      // Then
      expect(organizationId1.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(organizationId2.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(organizationId1.value).not.toBe(organizationId2.value);
    });

    it('생성된 ID는 유효한 OrganizationId여야 한다', () => {
      // When
      const organizationId = OrganizationId.generate();

      // Then
      expect(() => new OrganizationId(organizationId.value)).not.toThrow();
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const id1 = new OrganizationId('org_123');
      const id2 = new OrganizationId('org_123');

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new OrganizationId('org_123');
      const id2 = new OrganizationId('org_456');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
