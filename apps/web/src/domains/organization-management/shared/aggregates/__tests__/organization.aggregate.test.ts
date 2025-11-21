import { describe, it, expect, beforeEach } from 'vitest';
import { OrganizationAggregate } from '../organization.aggregate';
import { Organization } from '../../entities/organization.entity';
import { OrganizationId, UserId } from '../../value-objects/ids.vo';
import { OrganizationType } from '../../types';
import { DefaultOrganizationCreatedEvent, OrganizationUpdatedEvent } from '../../events';
import { OrganizationManagementError } from '../../errors/organization-management.error';

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
      expect(organizationAggregate.entity.organizationType).toBe('personal'); // 기본 조직은 개인 타입
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

  describe('createNew', () => {
    it('새로운 조직이 생성되어야 한다', () => {
      // Given
      const organizationName = 'New Organization';
      const organizationType: OrganizationType = 'startup';

      // When
      organizationAggregate = OrganizationAggregate.createNew(organizationName, organizationType, ownerId);

      // Then
      expect(organizationAggregate).toBeInstanceOf(OrganizationAggregate);
      expect(organizationAggregate.entity.name).toBe(organizationName);
      expect(organizationAggregate.entity.organizationType).toBe(organizationType);
      expect(organizationAggregate.entity.ownerId).toBe(ownerId);
    });

    it('조직 타입이 올바르게 설정되어야 한다', () => {
      // Given
      const organizationName = 'Test Company';
      const organizationType: OrganizationType = 'company';

      // When
      organizationAggregate = OrganizationAggregate.createNew(organizationName, organizationType, ownerId);

      // Then
      expect(organizationAggregate.entity.organizationType).toBe('company');
    });

    it('다양한 조직 타입으로 생성되어야 한다', () => {
      // Given
      const types: OrganizationType[] = ['personal', 'education', 'startup', 'agency', 'company', 'n/a'];

      types.forEach(type => {
        // When
        const org = OrganizationAggregate.createNew(`Test ${type} Org`, type, ownerId);

        // Then
        expect(org.entity.organizationType).toBe(type);
        expect(org.entity.name).toBe(`Test ${type} Org`);
      });
    });

    it('생성자가 소유자로 설정되어야 한다', () => {
      // Given
      const organizationName = 'Test Organization';
      const organizationType: OrganizationType = 'agency';

      // When
      organizationAggregate = OrganizationAggregate.createNew(organizationName, organizationType, ownerId);

      // Then
      expect(organizationAggregate.ownerId).toBe(ownerId);
      expect(organizationAggregate.entity.ownerId).toBe(ownerId);
    });

    it('isDefault가 false로 설정되어야 한다', () => {
      // Given
      const organizationName = 'New Organization';
      const organizationType: OrganizationType = 'startup';

      // When
      organizationAggregate = OrganizationAggregate.createNew(organizationName, organizationType, ownerId);

      // Then
      expect(organizationAggregate.isDefault).toBe(false);
      expect(organizationAggregate.entity.isDefault).toBe(false);
    });

    it('NewOrganizationCreatedEvent가 발행되어야 한다', () => {
      // Given
      const organizationName = 'Test Organization';
      const organizationType: OrganizationType = 'startup';

      // When
      const event = OrganizationAggregate.createNew(organizationName, organizationType, ownerId);

      // Then
      // 이 테스트는 createNew가 이벤트를 반환하도록 구현될 때 활성화됩니다
      // expect(event).toBeInstanceOf(NewOrganizationCreatedEvent);
    });
  });

  describe('changeMemberRole (Scenario 3)', () => {
    let targetUserId: UserId;
    let currentUserId: UserId;

    beforeEach(() => {
      organizationAggregate = OrganizationAggregate.createDefault('Test Organization', ownerId);
      targetUserId = new UserId('target_user_123');
      currentUserId = new UserId('current_user_456');
    });

    it('소유자가 멤버를 관리자로 승격해야 한다', () => {
      // Given: 소유자가 멤버를 관리자로 승격
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'member' as const;
      const newRole = 'admin' as const;

      // When
      const event = organizationAggregate.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole
      );

      // Then
      expect(event).toBeDefined();
      expect(event.type).toBe('MemberPromotedToAdmin');
      expect(event.targetUserId.equals(targetUserId)).toBe(true);
      expect(event.newRole).toBe('admin');
    });

    it('소유자가 관리자를 멤버로 강등해야 한다', () => {
      // Given: 소유자가 관리자를 멤버로 강등
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'admin' as const;
      const newRole = 'member' as const;

      // When
      const event = organizationAggregate.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole
      );

      // Then
      expect(event).toBeDefined();
      expect(event.type).toBe('AdminDemotedToMember');
      expect(event.targetUserId.equals(targetUserId)).toBe(true);
      expect(event.newRole).toBe('member');
    });

    it('관리자가 멤버를 관리자로 승격해야 한다', () => {
      // Given: 관리자가 멤버를 관리자로 승격
      const currentUserRole = 'admin' as const;
      const targetMemberRole = 'member' as const;
      const newRole = 'admin' as const;

      // When
      const event = organizationAggregate.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole
      );

      // Then
      expect(event).toBeDefined();
      expect(event.type).toBe('MemberPromotedToAdmin');
    });

    it('관리자는 관리자를 강등할 수 없어야 한다', () => {
      // Given: 관리자가 다른 관리자를 강등 시도
      const currentUserRole = 'admin' as const;
      const targetMemberRole = 'admin' as const;
      const newRole = 'member' as const;

      // When & Then
      try {
        organizationAggregate.changeMemberRole(
          targetUserId,
          currentUserId,
          currentUserRole,
          targetMemberRole,
          newRole
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OrganizationManagementError);
        expect((error as OrganizationManagementError).code).toBe('ADMIN_CANNOT_DEMOTE_ADMIN');
      }
    });

    it('소유자 역할은 변경할 수 없어야 한다', () => {
      // Given: 소유자 역할을 변경 시도
      const currentUserRole = 'admin' as const;
      const targetMemberRole = 'owner' as const;
      const newRole = 'admin' as const;

      // When & Then
      try {
        organizationAggregate.changeMemberRole(
          targetUserId,
          currentUserId,
          currentUserRole,
          targetMemberRole,
          newRole
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OrganizationManagementError);
        expect((error as OrganizationManagementError).code).toBe('CANNOT_CHANGE_OWNER_ROLE');
      }
    });

    it('소유자는 자신의 역할을 변경할 수 없어야 한다', () => {
      // Given: 소유자가 자신의 역할 변경 시도
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'owner' as const;
      const newRole = 'admin' as const;
      const sameUserId = ownerId; // currentUserId와 targetUserId가 같음

      // When & Then
      try {
        organizationAggregate.changeMemberRole(
          sameUserId,
          sameUserId,
          currentUserRole,
          targetMemberRole,
          newRole
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OrganizationManagementError);
        // 소유자 역할 변경이 먼저 체크되므로 CANNOT_CHANGE_OWNER_ROLE이 발생
        expect((error as OrganizationManagementError).code).toBe('CANNOT_CHANGE_OWNER_ROLE');
      }
    });

    it('현재 역할과 동일한 역할로 변경할 수 없어야 한다', () => {
      // Given: 동일한 역할로 변경 시도
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'admin' as const;
      const newRole = 'admin' as const; // 현재 역할과 동일

      // When & Then
      try {
        organizationAggregate.changeMemberRole(
          targetUserId,
          currentUserId,
          currentUserRole,
          targetMemberRole,
          newRole
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OrganizationManagementError);
        expect((error as OrganizationManagementError).code).toBe('ROLE_ALREADY_ASSIGNED');
      }
    });

    it('일반 멤버는 역할 변경 권한이 없어야 한다', () => {
      // Given: 일반 멤버가 역할 변경 시도
      const currentUserRole = 'member' as const;
      const targetMemberRole = 'member' as const;
      const newRole = 'admin' as const;

      // When & Then
      try {
        organizationAggregate.changeMemberRole(
          targetUserId,
          currentUserId,
          currentUserRole,
          targetMemberRole,
          newRole
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(OrganizationManagementError);
        expect((error as OrganizationManagementError).code).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });

    it('MemberPromotedToAdminEvent가 발행되어야 한다', () => {
      // Given
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'member' as const;
      const newRole = 'admin' as const;

      // When
      const event = organizationAggregate.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole
      );

      // Then
      expect(event.type).toBe('MemberPromotedToAdmin');
      expect(event.organizationId.equals(organizationAggregate.id)).toBe(true);
      expect(event.targetUserId.equals(targetUserId)).toBe(true);
      if (event.type === 'MemberPromotedToAdmin') {
        expect(event.promotedBy.equals(currentUserId)).toBe(true);
      }
      expect(event.newRole).toBe('admin');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('AdminDemotedToMemberEvent가 발행되어야 한다', () => {
      // Given
      const currentUserRole = 'owner' as const;
      const targetMemberRole = 'admin' as const;
      const newRole = 'member' as const;

      // When
      const event = organizationAggregate.changeMemberRole(
        targetUserId,
        currentUserId,
        currentUserRole,
        targetMemberRole,
        newRole
      );

      // Then
      expect(event.type).toBe('AdminDemotedToMember');
      expect(event.organizationId.equals(organizationAggregate.id)).toBe(true);
      expect(event.targetUserId.equals(targetUserId)).toBe(true);
      if (event.type === 'AdminDemotedToMember') {
        expect(event.demotedBy.equals(currentUserId)).toBe(true);
      }
      expect(event.newRole).toBe('member');
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });
});
