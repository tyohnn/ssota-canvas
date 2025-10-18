import { Workspace } from '../entities/workspace.entity';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import { WorkspaceInvitationId } from '../value-objects/workspace-invitation-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import {
  WorkspaceCreatedEvent,
  WorkspaceMembershipVerifiedEvent,
  WorkspaceManagementDomainEvent,
} from '../events';
import {
  createWorkspaceManagementError,
  WorkspaceManagementError,
} from '../errors/workspace-management.error';
import type {
  CreateDefaultWorkspaceCommand,
  CreateWorkspaceCommand,
} from '../commands';

/**
 * Workspace Aggregate
 *
 * Workspace 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
 *
 * 주요 책임:
 * - Workspace 생성 (Default/일반)
 * - Workspace 멤버십 검증
 * - 도메인 이벤트 발행 및 관리
 */
export class WorkspaceAggregate {
  private _workspace: Workspace;
  private _events: WorkspaceManagementDomainEvent[] = [];

  constructor(workspace: Workspace) {
    this._workspace = workspace;
  }

  /**
   * Default Workspace 생성 (팩토리 메서드)
   *
   * @param command - Default Workspace 생성 Command
   * @returns WorkspaceAggregate 인스턴스
   */
  static createDefault(
    command: CreateDefaultWorkspaceCommand
  ): WorkspaceAggregate {
    // 1. WorkspaceId 생성
    const workspaceId = new WorkspaceId(crypto.randomUUID());
    const organizationId = new OrganizationId(command.organizationId);

    // 2. Workspace Entity 생성 (isDefault=true, deletable=false)
    const workspace = new Workspace(
      workspaceId,
      organizationId,
      'Default Workspace', // 고정 이름
      null, // description
      null, // icon
      true, // isDefault
      false, // deletable
      command.createdBy,
      new Date(),
      new Date(),
      null
    );

    // 3. Aggregate 생성
    const aggregate = new WorkspaceAggregate(workspace);

    // 4. WorkspaceCreated 이벤트 발행
    aggregate.addEvent({
      type: 'WorkspaceCreated',
      workspaceId: workspaceId.value,
      organizationId: organizationId.value,
      name: workspace.name,
      isDefault: true,
      occurredAt: new Date(),
    });

    return aggregate;
  }

  /**
   * 일반 Workspace 생성 (팩토리 메서드)
   *
   * @param command - Workspace 생성 Command
   * @returns WorkspaceAggregate 인스턴스
   */
  static create(command: CreateWorkspaceCommand): WorkspaceAggregate {
    // 1. WorkspaceId 생성
    const workspaceId = new WorkspaceId(crypto.randomUUID());
    const organizationId = new OrganizationId(command.organizationId);

    // 2. Workspace Entity 생성 (isDefault=false, deletable=true)
    const workspace = new Workspace(
      workspaceId,
      organizationId,
      command.name,
      command.description || null,
      command.icon || null,
      false, // isDefault
      true, // deletable
      command.createdBy,
      new Date(),
      new Date(),
      null
    );

    // 3. Aggregate 생성
    const aggregate = new WorkspaceAggregate(workspace);

    // 4. WorkspaceCreated 이벤트 발행
    aggregate.addEvent({
      type: 'WorkspaceCreated',
      workspaceId: workspaceId.value,
      organizationId: organizationId.value,
      name: workspace.name,
      isDefault: false,
      occurredAt: new Date(),
    });

    return aggregate;
  }

  /**
   * Workspace 정보 업데이트 (Scenario 2)
   *
   * @param name - 새 이름
   * @param description - 새 설명
   * @param icon - 새 아이콘
   */
  updateInfo(
    name: string,
    description: string | null,
    icon: string | null
  ): void {
    // 1. Entity의 updateInfo 메서드 호출 (검증 포함)
    this._workspace.updateInfo(name, description, icon);

    // 2. WorkspaceUpdated 이벤트 발행
    this.addEvent({
      type: 'WorkspaceUpdated',
      workspaceId: this._workspace.workspaceId.value,
      changes: {
        name,
        description: description ?? undefined,
        icon: icon ?? undefined,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Workspace 멤버십 검증
   *
   * @param userId - 사용자 ID
   * @param isOrgMember - 조직 멤버 여부
   * @returns 접근 권한 여부
   */
  verifyMembership(userId: string, isOrgMember: boolean): boolean {
    let hasAccess: boolean;

    // Default Workspace는 조직 멤버면 자동 접근
    if (this._workspace.isDefault) {
      hasAccess = isOrgMember;
    } else {
      // 일반 Workspace는 Repository에서 멤버십 확인 필요
      hasAccess = false;
    }

    // 이벤트 발행
    this.addEvent({
      type: 'WorkspaceMembershipVerified',
      workspaceId: this._workspace.workspaceId.value,
      userId,
      hasAccess,
      occurredAt: new Date(),
    });

    return hasAccess;
  }

  /**
   * Workspace 멤버 초대 (Scenario 3)
   *
   * @param invitedUserId - 초대받을 사용자 ID
   * @param inviterUserId - 초대하는 사용자 ID
   * @param isInviterAdmin - 초대자가 조직 Admin인지
   * @param isInviterWorkspaceMember - 초대자가 Workspace 멤버인지
   * @param isAlreadyMember - 이미 멤버인지
   * @returns WorkspaceInvitation Entity
   */
  inviteMember(
    invitedUserId: string,
    inviterUserId: string,
    isInviterAdmin: boolean,
    isInviterWorkspaceMember: boolean,
    isAlreadyMember: boolean
  ): WorkspaceInvitation {
    // 1. 권한 검증: 조직 Admin + Workspace 멤버만 초대 가능
    if (!isInviterAdmin || !isInviterWorkspaceMember) {
      throw createWorkspaceManagementError('INSUFFICIENT_PERMISSIONS');
    }

    // 2. 중복 초대 방지: 이미 멤버인 경우
    if (isAlreadyMember) {
      throw createWorkspaceManagementError('ALREADY_WORKSPACE_MEMBER');
    }

    // 3. WorkspaceInvitation Entity 생성
    const invitationId = new WorkspaceInvitationId(crypto.randomUUID());
    const invitation = new WorkspaceInvitation(
      invitationId,
      this._workspace.workspaceId,
      invitedUserId,
      inviterUserId,
      'pending',
      null,
      new Date(),
      null
    );

    // 4. WorkspaceMemberInvitationCreated 이벤트 발행
    this.addEvent({
      type: 'WorkspaceMemberInvitationCreated',
      invitationId: invitationId.value,
      workspaceId: this._workspace.workspaceId.value,
      invitedUserId,
      invitedBy: inviterUserId,
      occurredAt: new Date(),
    });

    return invitation;
  }

  /**
   * Workspace 초대 수락 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 수락하는 사용자 ID
   * @param isInvitee - 본인이 초대받은 사람인지
   * @param isAlreadyProcessed - 이미 처리된 초대인지
   */
  acceptInvitation(
    invitationId: string,
    userId: string,
    isInvitee: boolean,
    isAlreadyProcessed: boolean
  ): void {
    // 1. 권한 검증: 초대받은 본인만 수락 가능
    if (!isInvitee) {
      throw createWorkspaceManagementError('NOT_INVITATION_TARGET');
    }

    // 2. 중복 처리 방지: 이미 처리된 초대
    if (isAlreadyProcessed) {
      throw createWorkspaceManagementError('INVITATION_ALREADY_PROCESSED');
    }

    // 3. WorkspaceInvitationAccepted 이벤트 발행
    this.addEvent({
      type: 'WorkspaceInvitationAccepted',
      invitationId,
      workspaceId: this._workspace.workspaceId.value,
      userId,
      occurredAt: new Date(),
    });

    // 4. MemberAddedToWorkspace 이벤트 발행
    this.addEvent({
      type: 'MemberAddedToWorkspace',
      workspaceId: this._workspace.workspaceId.value,
      userId,
      occurredAt: new Date(),
    });
  }

  /**
   * Workspace 초대 거절 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 거절하는 사용자 ID
   * @param isInvitee - 본인이 초대받은 사람인지
   * @param isAlreadyProcessed - 이미 처리된 초대인지
   */
  rejectInvitation(
    invitationId: string,
    userId: string,
    isInvitee: boolean,
    isAlreadyProcessed: boolean
  ): void {
    // 1. 권한 검증: 초대받은 본인만 거절 가능
    if (!isInvitee) {
      throw createWorkspaceManagementError('NOT_INVITATION_TARGET');
    }

    // 2. 중복 처리 방지: 이미 처리된 초대
    if (isAlreadyProcessed) {
      throw createWorkspaceManagementError('INVITATION_ALREADY_PROCESSED');
    }

    // 3. WorkspaceInvitationRejected 이벤트 발행
    this.addEvent({
      type: 'WorkspaceInvitationRejected',
      invitationId,
      userId,
      occurredAt: new Date(),
    });
  }

  /**
   * 미커밋 이벤트 목록 반환 및 클리어
   *
   * @returns 도메인 이벤트 배열
   */
  getUncommittedEvents(): WorkspaceManagementDomainEvent[] {
    const events = [...this._events];
    this._events = []; // 이벤트 클리어
    return events;
  }

  /**
   * 이벤트 추가 (private)
   */
  private addEvent(event: WorkspaceManagementDomainEvent): void {
    this._events.push(event);
  }

  // Getters
  get workspace(): Workspace {
    return this._workspace;
  }
}
