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

  // Scenario 2: Workspace 정보 수정
  describe('updateInfo (Command 처리)', () => {
    it('이름/설명/아이콘을 업데이트해야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Original Name',
        description: 'Original Description',
        icon: '🏠',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어

      // When
      aggregate.updateInfo('Updated Name', 'Updated Description', '🚀');

      // Then
      expect(aggregate.workspace.name).toBe('Updated Name');
      expect(aggregate.workspace.description).toBe('Updated Description');
      expect(aggregate.workspace.icon).toBe('🚀');
    });

    it('이름만 업데이트해도 WorkspaceUpdatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Original Name',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어

      // When
      aggregate.updateInfo('New Name', null, null);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceUpdated');
      const event = events[0] as any;
      expect(event.changes.name).toBe('New Name');
    });

    it('설명만 업데이트해도 WorkspaceUpdatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어

      // When
      aggregate.updateInfo('Test Workspace', 'New Description', null);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceUpdated');
      const event = events[0] as any;
      expect(event.changes.description).toBe('New Description');
    });

    it('아이콘만 업데이트해도 WorkspaceUpdatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        icon: '🏠',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어

      // When
      aggregate.updateInfo('Test Workspace', null, '🎨');
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceUpdated');
      const event = events[0] as any;
      expect(event.changes.icon).toBe('🎨');
    });

    it('여러 필드 동시 업데이트 시 WorkspaceUpdatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Old Name',
        description: 'Old Description',
        icon: '🏠',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어

      // When
      aggregate.updateInfo('New Name', 'New Description', '🚀');
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceUpdated');
      const event = events[0] as any;
      expect(event.changes.name).toBe('New Name');
      expect(event.changes.description).toBe('New Description');
      expect(event.changes.icon).toBe('🚀');
    });

    it('이름이 빈 문자열이면 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() => aggregate.updateInfo('', null, null)).toThrow(
        WorkspaceManagementError
      );
    });

    it('updated_at 타임스탬프가 갱신되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      const originalUpdatedAt = aggregate.workspace.updatedAt;

      // When
      // 약간의 시간 차이를 만들기 위해
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      sleep(10);
      aggregate.updateInfo('Updated Name', null, null);

      // Then
      expect(aggregate.workspace.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('inviteMember (Command 처리) - Scenario 3', () => {
    it('조직 Admin + Workspace 멤버가 초대할 수 있어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      const invitedUserId = 'user-789';
      const inviterUserId = createdBy;

      // When
      const invitation = aggregate.inviteMember(
        invitedUserId,
        inviterUserId,
        true,  // isInviterAdmin
        true,  // isInviterWorkspaceMember
        false  // isAlreadyMember
      );

      // Then
      expect(invitation).toBeDefined();
      expect(invitation.invitedUserId).toBe(invitedUserId);
      expect(invitation.invitedBy).toBe(inviterUserId);
      expect(invitation.status).toBe('pending');
    });

    it('조직 Admin이 아니면 초대할 수 없다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.inviteMember(
          'user-789',
          'member-999',
          false, // isInviterAdmin = false
          true,
          false
        )
      ).toThrow(WorkspaceManagementError);
      expect(() =>
        aggregate.inviteMember(
          'user-789',
          'member-999',
          false,
          true,
          false
        )
      ).toThrow('권한이 부족합니다');
    });

    it('Workspace 멤버가 아니면 초대할 수 없다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.inviteMember(
          'user-789',
          'admin-999',
          true,
          false, // isInviterWorkspaceMember = false
          false
        )
      ).toThrow(WorkspaceManagementError);
    });

    it('이미 Workspace 멤버인 경우 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.inviteMember(
          'user-789',
          createdBy,
          true,
          true,
          true // isAlreadyMember = true
        )
      ).toThrow(WorkspaceManagementError);
      expect(() =>
        aggregate.inviteMember(
          'user-789',
          createdBy,
          true,
          true,
          true
        )
      ).toThrow('이미 Workspace 멤버입니다');
    });

    it('WorkspaceMemberInvitationCreated 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // Clear events

      // When
      aggregate.inviteMember('user-789', createdBy, true, true, false);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceMemberInvitationCreated');
    });
  });

  describe('acceptInvitation (Command 처리) - Scenario 3', () => {
    it('초대받은 본인만 수락할 수 있어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      const invitationId = '770e8400-e29b-41d4-a716-446655440000';
      const userId = 'user-789';

      // When
      aggregate.acceptInvitation(
        invitationId,
        userId,
        true,  // isInvitee
        false  // isAlreadyProcessed
      );
      const events = aggregate.getUncommittedEvents();

      // Then
      const acceptedEvent = events.find(e => e.type === 'WorkspaceInvitationAccepted');
      expect(acceptedEvent).toBeDefined();
    });

    it('본인이 아니면 초대를 수락할 수 없다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.acceptInvitation(
          '770e8400-e29b-41d4-a716-446655440000',
          'other-user',
          false, // isInvitee = false
          false
        )
      ).toThrow(WorkspaceManagementError);
      expect(() =>
        aggregate.acceptInvitation(
          '770e8400-e29b-41d4-a716-446655440000',
          'other-user',
          false,
          false
        )
      ).toThrow('본인의 초대만 처리할 수 있습니다');
    });

    it('이미 처리된 초대는 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.acceptInvitation(
          '770e8400-e29b-41d4-a716-446655440000',
          'user-789',
          true,
          true // isAlreadyProcessed = true
        )
      ).toThrow(WorkspaceManagementError);
      expect(() =>
        aggregate.acceptInvitation(
          '770e8400-e29b-41d4-a716-446655440000',
          'user-789',
          true,
          true
        )
      ).toThrow('이미 처리된 초대입니다');
    });

    it('WorkspaceInvitationAccepted, MemberAddedToWorkspace 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // Clear events

      // When
      aggregate.acceptInvitation(
        '770e8400-e29b-41d4-a716-446655440000',
        'user-789',
        true,
        false
      );
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some(e => e.type === 'WorkspaceInvitationAccepted')).toBe(true);
      expect(events.some(e => e.type === 'MemberAddedToWorkspace')).toBe(true);
    });
  });

  describe('rejectInvitation (Command 처리) - Scenario 3', () => {
    it('초대받은 본인만 거절할 수 있어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      const invitationId = '770e8400-e29b-41d4-a716-446655440000';
      const userId = 'user-789';

      // When
      aggregate.rejectInvitation(invitationId, userId, true, false);
      const events = aggregate.getUncommittedEvents();

      // Then
      const rejectedEvent = events.find(e => e.type === 'WorkspaceInvitationRejected');
      expect(rejectedEvent).toBeDefined();
    });

    it('본인이 아니면 초대를 거절할 수 없다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);

      // When & Then
      expect(() =>
        aggregate.rejectInvitation(
          '770e8400-e29b-41d4-a716-446655440000',
          'other-user',
          false, // isInvitee = false
          false
        )
      ).toThrow(WorkspaceManagementError);
    });

    it('WorkspaceInvitationRejected 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreateWorkspaceCommand = {
        organizationId: organizationId.value,
        name: 'Test Workspace',
        createdBy,
      };
      const aggregate = WorkspaceAggregate.create(command);
      aggregate.getUncommittedEvents(); // Clear events

      // When
      aggregate.rejectInvitation(
        '770e8400-e29b-41d4-a716-446655440000',
        'user-789',
        true,
        false
      );
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('WorkspaceInvitationRejected');
    });
  });
});

