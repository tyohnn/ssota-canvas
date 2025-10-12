import { Workspace } from '../entities/workspace.entity';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import {
  WorkspaceCreatedEvent,
  WorkspaceMembershipVerifiedEvent,
  WorkspaceManagementDomainEvent,
} from '../events';
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
