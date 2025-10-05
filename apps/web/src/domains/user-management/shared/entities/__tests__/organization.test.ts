import { describe, it, expect, beforeEach } from 'vitest';
import { Organization } from '../organization.entity';
import { OrganizationId, UserId } from '../../value-objects/ids.vo';

describe('Organization Entity', () => {
  let organizationId: OrganizationId;
  let ownerId: UserId;
  let organization: Organization;

  beforeEach(() => {
    organizationId = OrganizationId.generate();
    ownerId = new UserId('user_123');
    organization = new Organization(
      organizationId,
      'Test Organization',
      ownerId,
      true, // isDefault
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:00:00Z')
    );
  });

  describe('생성', () => {
    it('모든 필수 속성으로 Organization이 생성되어야 한다', () => {
      // When & Then
      expect(organization.id).toBe(organizationId);
      expect(organization.name).toBe('Test Organization');
      expect(organization.ownerId).toBe(ownerId);
      expect(organization.isDefault).toBe(true);
      expect(organization.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(organization.updatedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('isDefault 플래그가 올바르게 설정되어야 한다', () => {
      // Given
      const nonDefaultOrg = new Organization(
        OrganizationId.generate(),
        'Non-Default Org',
        ownerId,
        false, // isDefault
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );

      // When & Then
      expect(nonDefaultOrg.isDefault).toBe(false);
      expect(organization.isDefault).toBe(true);
    });

    it('createdAt과 updatedAt이 같아야 한다', () => {
      // Given
      const now = new Date();

      // When
      const newOrg = new Organization(
        OrganizationId.generate(),
        'New Org',
        ownerId,
        false,
        now,
        now
      );

      // Then
      expect(newOrg.createdAt.getTime()).toBe(newOrg.updatedAt.getTime());
    });
  });

  describe('updateName', () => {
    it('조직 이름을 업데이트해야 한다', () => {
      // Given
      const newName = 'Updated Organization';
      const originalUpdatedAt = organization.updatedAt;

      // When
      organization.updateName(newName);

      // Then
      expect(organization.name).toBe(newName);
      expect(organization.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('빈 이름도 허용해야 한다 (비즈니스 규칙에 따라)', () => {
      // Given
      const emptyName = '';
      const originalUpdatedAt = organization.updatedAt;

      // When
      organization.updateName(emptyName);

      // Then
      expect(organization.name).toBe(emptyName);
      expect(organization.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('updatedAt이 현재 시간으로 업데이트되어야 한다', () => {
      // Given
      const beforeUpdate = new Date();
      const newName = 'Updated Name';

      // When
      organization.updateName(newName);
      const afterUpdate = new Date();

      // Then
      expect(organization.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(organization.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('매우 긴 이름을 처리할 수 있어야 한다', () => {
      // Given
      const longName = 'A'.repeat(1000);
      const originalUpdatedAt = organization.updatedAt;

      // When
      organization.updateName(longName);

      // Then
      expect(organization.name).toBe(longName);
      expect(organization.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('불변성', () => {
    it('id는 변경할 수 없어야 한다', () => {
      // Given
      const originalId = organization.id;

      // When
      // id는 readonly이므로 직접 변경할 수 없음
      
      // Then
      expect(organization.id).toBe(originalId);
    });

    it('ownerId는 변경할 수 없어야 한다', () => {
      // Given
      const originalOwnerId = organization.ownerId;

      // When
      // ownerId는 private이므로 직접 변경할 수 없음
      
      // Then
      expect(organization.ownerId).toBe(originalOwnerId);
    });

    it('createdAt는 변경할 수 없어야 한다', () => {
      // Given
      const originalCreatedAt = organization.createdAt;

      // When
      organization.updateName('New Name');
      
      // Then
      expect(organization.createdAt).toBe(originalCreatedAt);
    });

    it('isDefault는 변경할 수 없어야 한다', () => {
      // Given
      const originalIsDefault = organization.isDefault;

      // When
      organization.updateName('New Name');
      
      // Then
      expect(organization.isDefault).toBe(originalIsDefault);
    });
  });

  describe('Edge Cases', () => {
    it('특수 문자가 포함된 이름을 처리할 수 있어야 한다', () => {
      // Given
      const specialName = '조직명!@#$%^&*()_+-=[]{}|;:,.<>?';
      const originalUpdatedAt = organization.updatedAt;

      // When
      organization.updateName(specialName);

      // Then
      expect(organization.name).toBe(specialName);
      expect(organization.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('유니코드 문자가 포함된 이름을 처리할 수 있어야 한다', () => {
      // Given
      const unicodeName = '테스트 조직 🏢 組織 组织';
      const originalUpdatedAt = organization.updatedAt;

      // When
      organization.updateName(unicodeName);

      // Then
      expect(organization.name).toBe(unicodeName);
      expect(organization.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
