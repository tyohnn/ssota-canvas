import { describe, it, expect, beforeEach } from 'vitest';
import { OrganizationAggregate } from '../organization.aggregate';
import { Organization } from '../../entities/organization.entity';
import { OrganizationId, UserId } from '../../value-objects/ids.vo';
import { DefaultOrganizationCreatedEvent, OrganizationUpdatedEvent } from '../../events';

describe('OrganizationAggregate', () => {
  let ownerId: UserId;
  let organizationAggregate: OrganizationAggregate;

  beforeEach(() => {
    ownerId = new UserId('user_123456789');
  });

  describe('createDefault', () => {
    it('사용자를 위한 기본 조직이 생성되어야 한다', () => {
      // Given
      const organizationName = 'Test User\'s Organization';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(organizationName, ownerId);

      // Then
      expect(organizationAggregate).toBeInstanceOf(OrganizationAggregate);
      expect(organizationAggregate.entity.name).toBe(organizationName);
      expect(organizationAggregate.entity.ownerId).toBe(ownerId);
    });

    it('isDefault가 true로 설정되어야 한다', () => {
      // Given
      const organizationName = 'Default Organization';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(organizationName, ownerId);

      // Then
      expect(organizationAggregate.isDefault).toBe(true);
      expect(organizationAggregate.entity.isDefault).toBe(true);
    });

    it('소유자가 올바르게 설정되어야 한다', () => {
      // Given
      const organizationName = 'Test Organization';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(organizationName, ownerId);

      // Then
      expect(organizationAggregate.ownerId).toBe(ownerId);
      expect(organizationAggregate.entity.ownerId).toBe(ownerId);
    });

    it('생성된 조직 ID가 유효해야 한다', () => {
      // Given
      const organizationName = 'Test Organization';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(organizationName, ownerId);

      // Then
      expect(organizationAggregate.id).toBeInstanceOf(OrganizationId);
      expect(organizationAggregate.id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('createdAt과 updatedAt이 현재 시간으로 설정되어야 한다', () => {
      // Given
      const organizationName = 'Test Organization';
      const beforeCreation = new Date();

      // When
      organizationAggregate = OrganizationAggregate.createDefault(organizationName, ownerId);
      const afterCreation = new Date();

      // Then
      expect(organizationAggregate.entity.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(organizationAggregate.entity.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(organizationAggregate.entity.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(organizationAggregate.entity.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('빈 이름으로도 조직이 생성되어야 한다', () => {
      // Given
      const emptyName = '';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(emptyName, ownerId);

      // Then
      expect(organizationAggregate.entity.name).toBe(emptyName);
      expect(organizationAggregate.isDefault).toBe(true);
    });

    it('매우 긴 이름으로도 조직이 생성되어야 한다', () => {
      // Given
      const longName = 'A'.repeat(1000);

      // When
      organizationAggregate = OrganizationAggregate.createDefault(longName, ownerId);

      // Then
      expect(organizationAggregate.entity.name).toBe(longName);
      expect(organizationAggregate.isDefault).toBe(true);
    });

    it('특수 문자가 포함된 이름으로 조직이 생성되어야 한다', () => {
      // Given
      const specialName = '테스트 조직!@#$%^&*()_+-=[]{}|;:,.<>? 🏢';

      // When
      organizationAggregate = OrganizationAggregate.createDefault(specialName, ownerId);

      // Then
      expect(organizationAggregate.entity.name).toBe(specialName);
      expect(organizationAggregate.isDefault).toBe(true);
    });
  });

  describe('updateName', () => {
    beforeEach(() => {
      organizationAggregate = OrganizationAggregate.createDefault('Original Organization', ownerId);
    });

    it('조직 이름이 변경되어야 한다', () => {
      // Given
      const newName = 'Updated Organization';
      const originalUpdatedAt = organizationAggregate.entity.updatedAt;

      // When
      const event = organizationAggregate.updateName(newName);

      // Then
      expect(organizationAggregate.entity.name).toBe(newName);
      expect(organizationAggregate.entity.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
    });

    it('OrganizationUpdatedEvent가 발행되어야 한다', () => {
      // Given
      const newName = 'Updated Organization';

      // When
      const event = organizationAggregate.updateName(newName);

      // Then
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
      expect(event.type).toBe('OrganizationUpdated');
      expect(event.organizationId).toBe(organizationAggregate.id);
      expect(event.name).toBe(newName);
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('이름을 빈 문자열로 변경할 수 있어야 한다', () => {
      // Given
      const emptyName = '';

      // When
      const event = organizationAggregate.updateName(emptyName);

      // Then
      expect(organizationAggregate.entity.name).toBe(emptyName);
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
      expect(event.name).toBe(emptyName);
    });

    it('동일한 이름으로 변경해도 이벤트가 발행되어야 한다', () => {
      // Given
      const sameName = organizationAggregate.entity.name;
      const originalUpdatedAt = organizationAggregate.entity.updatedAt;

      // When
      const event = organizationAggregate.updateName(sameName);

      // Then
      expect(organizationAggregate.entity.name).toBe(sameName);
      expect(organizationAggregate.entity.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
    });

    it('매우 긴 이름으로 변경할 수 있어야 한다', () => {
      // Given
      const longName = 'B'.repeat(2000);

      // When
      const event = organizationAggregate.updateName(longName);

      // Then
      expect(organizationAggregate.entity.name).toBe(longName);
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
      expect(event.name).toBe(longName);
    });

    it('특수 문자가 포함된 이름으로 변경할 수 있어야 한다', () => {
      // Given
      const specialName = '새로운 조직명!@#$%^&*()_+-=[]{}|;:,.<>? 🚀';

      // When
      const event = organizationAggregate.updateName(specialName);

      // Then
      expect(organizationAggregate.entity.name).toBe(specialName);
      expect(event).toBeInstanceOf(OrganizationUpdatedEvent);
      expect(event.name).toBe(specialName);
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      organizationAggregate = OrganizationAggregate.createDefault('Test Organization', ownerId);
    });

    it('id getter가 올바르게 동작해야 한다', () => {
      // When & Then
      expect(organizationAggregate.id).toBeInstanceOf(OrganizationId);
      expect(organizationAggregate.id).toBe(organizationAggregate.entity.id);
    });

    it('entity getter가 올바르게 동작해야 한다', () => {
      // When & Then
      expect(organizationAggregate.entity).toBeInstanceOf(Organization);
      expect(organizationAggregate.entity.name).toBe('Test Organization');
      expect(organizationAggregate.entity.ownerId).toBe(ownerId);
    });

    it('ownerId getter가 올바르게 동작해야 한다', () => {
      // When & Then
      expect(organizationAggregate.ownerId).toBe(ownerId);
      expect(organizationAggregate.ownerId).toBe(organizationAggregate.entity.ownerId);
    });

    it('isDefault getter가 올바르게 동작해야 한다', () => {
      // When & Then
      expect(organizationAggregate.isDefault).toBe(true);
      expect(organizationAggregate.isDefault).toBe(organizationAggregate.entity.isDefault);
    });
  });

  describe('불변성', () => {
    beforeEach(() => {
      organizationAggregate = OrganizationAggregate.createDefault('Test Organization', ownerId);
    });

    it('id는 변경되지 않아야 한다', () => {
      // Given
      const originalId = organizationAggregate.id;

      // When
      organizationAggregate.updateName('New Name');

      // Then
      expect(organizationAggregate.id).toBe(originalId);
    });

    it('ownerId는 변경되지 않아야 한다', () => {
      // Given
      const originalOwnerId = organizationAggregate.ownerId;

      // When
      organizationAggregate.updateName('New Name');

      // Then
      expect(organizationAggregate.ownerId).toBe(originalOwnerId);
    });

    it('isDefault는 변경되지 않아야 한다', () => {
      // Given
      const originalIsDefault = organizationAggregate.isDefault;

      // When
      organizationAggregate.updateName('New Name');

      // Then
      expect(organizationAggregate.isDefault).toBe(originalIsDefault);
    });

    it('createdAt는 변경되지 않아야 한다', () => {
      // Given
      const originalCreatedAt = organizationAggregate.entity.createdAt;

      // When
      organizationAggregate.updateName('New Name');

      // Then
      expect(organizationAggregate.entity.createdAt).toBe(originalCreatedAt);
    });
  });
});
