import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceAggregate } from '../workspace.aggregate';
import { WorkspaceId } from '../../value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';
import type { CreateWorkspaceCommand, CreateDefaultWorkspaceCommand } from '../../commands';

describe('Workspace Aggregate', () => {
  let organizationId: OrganizationId;
  let createdBy: string;

  beforeEach(() => {
    organizationId = new OrganizationId(
      '550e8400-e29b-41d4-a716-446655440000'
    );
    createdBy = '660e8400-e29b-41d4-a716-446655440000';
  });

  describe('createDefault (팩토리 메서드)', () => {
    it('유효한 Organization ID로 Default Workspace를 생성해야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.createDefault(command);

      // Then
      expect(aggregate).toBeInstanceOf(WorkspaceAggregate);
      expect(aggregate.workspace.organizationId.equals(organizationId)).toBe(true);
      expect(aggregate.workspace.isDefault).toBe(true);
      expect(aggregate.workspace.deletable).toBe(false);
    });

    it('is_default=true로 설정되어야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.createDefault(command);

      // Then
      expect(aggregate.workspace.isDefault).toBe(true);
    });

    it('deletable=false로 설정되어야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.createDefault(command);

      // Then
      expect(aggregate.workspace.deletable).toBe(false);
    });

    it('WorkspaceCreated 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.createDefault(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceCreated');
      const event = events[0] as any;
      expect(event.isDefault).toBe(true);
    });

    it('Default Workspace 이름이 설정되어야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.createDefault(command);

      // Then
      expect(aggregate.workspace.name).toBe('Default Workspace');
    });
  });

  describe('create (팩토리 메서드)', () => {
    it('유효한 데이터로 일반 Workspace를 생성해야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Project Workspace',
        description: 'Test description',
        icon: '🚀',
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.create(command);

      // Then
      expect(aggregate).toBeInstanceOf(WorkspaceAggregate);
      expect(aggregate.workspace.name).toBe('Project Workspace');
      expect(aggregate.workspace.description).toBe('Test description');
      expect(aggregate.workspace.icon).toBe('🚀');
    });

    it('is_default=false로 설정되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Regular Workspace',
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.create(command);

      // Then
      expect(aggregate.workspace.isDefault).toBe(false);
    });

    it('deletable=true로 설정되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Regular Workspace',
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.create(command);

      // Then
      expect(aggregate.workspace.deletable).toBe(true);
    });

    it('WorkspaceCreated 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Project Workspace',
        createdBy,
      };

      // When
      const aggregate = WorkspaceAggregate.create(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceCreated');
      const event = events[0] as any;
      expect(event.isDefault).toBe(false);
      expect(event.name).toBe('Project Workspace');
    });

    it('빈 이름으로 생성하면 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: '', // 빈 이름
        createdBy,
      };

      // When & Then
      expect(() => WorkspaceAggregate.create(command)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('verifyMembership', () => {
    it('Default Workspace는 조직 멤버면 항상 true를 반환해야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };
      const aggregate = WorkspaceAggregate.createDefault(command);
      const userId = createdBy;

      // When
      const hasAccess = aggregate.verifyMembership(userId, true); // isOrgMember=true

      // Then
      expect(hasAccess).toBe(true);
    });

    it('Default Workspace는 조직 멤버 아니면 false를 반환해야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };
      const aggregate = WorkspaceAggregate.createDefault(command);
      const userId = '770e8400-e29b-41d4-a716-446655440000';

      // When
      const hasAccess = aggregate.verifyMembership(userId, false); // isOrgMember=false

      // Then
      expect(hasAccess).toBe(false);
    });

    it('일반 Workspace는 멤버십 확인을 요구해야 한다 (Repository 조회 필요)', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Private Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      const userId = '770e8400-e29b-41d4-a716-446655440000';

      // When
      const hasAccess = aggregate.verifyMembership(userId, true); // isOrgMember=true

      // Then
      // 일반 Workspace는 Aggregate에서 판단할 수 없고, Repository 조회 필요
      // 따라서 false 반환 (Repository에서 실제 멤버십 확인 필요)
      expect(hasAccess).toBe(false);
    });

    it('WorkspaceMembershipVerified 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateDefaultWorkspaceCommand = {
        organizationId: organizationId.value,
        createdBy,
      };
      const aggregate = WorkspaceAggregate.createDefault(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어
      const userId = createdBy;

      // When
      aggregate.verifyMembership(userId, true);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceMembershipVerified');
      const event = events[0] as any;
      expect(event.hasAccess).toBe(true);
    });
  });

  describe('getUncommittedEvents', () => {
    it('발행된 이벤트 목록을 반환해야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceCreated');
    });

    it('이벤트를 반환 후 이벤트 목록이 클리어되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When
      const events1 = aggregate.getUncommittedEvents();
      const events2 = aggregate.getUncommittedEvents();

      // Then
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(0); // 클리어됨
    });
  });
});

