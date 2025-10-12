import { WorkspaceId } from '../value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import {
  WorkspaceManagementError,
  createWorkspaceManagementError,
} from '../errors/workspace-management.error';

/**
 * Workspace Entity
 *
 * Workspace 도메인 엔티티로 Workspace의 핵심 정보와 비즈니스 로직을 캡슐화
 *
 * 비즈니스 규칙:
 * - 이름은 1-100자
 * - 설명은 최대 500자
 * - Default Workspace는 deletable=false
 * - 조직당 1개의 Default Workspace만 허용
 */
export class Workspace {
  constructor(
    public readonly workspaceId: WorkspaceId,
    public readonly organizationId: OrganizationId,
    private _name: string,
    private _description: string | null,
    private _icon: string | null,
    public readonly isDefault: boolean,
    public readonly deletable: boolean,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null
  ) {
    // 생성자 검증
    this.validateName(_name);
    this.validateDescription(_description);
    this.validateDefaultDeletable(isDefault, deletable);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get icon(): string | null {
    return this._icon;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  /**
   * Workspace 정보 업데이트
   *
   * @param name - 새 이름 (1-100자)
   * @param description - 새 설명 (최대 500자)
   * @param icon - 새 아이콘
   */
  updateInfo(
    name: string,
    description: string | null,
    icon: string | null
  ): void {
    this.validateName(name);
    this.validateDescription(description);

    this._name = name;
    this._description = description;
    this._icon = icon;
    this._updatedAt = new Date();
  }

  /**
   * 소프트 삭제
   *
   * Default Workspace는 삭제 불가
   */
  softDelete(): void {
    if (!this.canBeDeleted()) {
      throw new WorkspaceManagementError(
        'DEFAULT_WORKSPACE_NOT_DELETABLE',
        'Default workspace cannot be deleted'
      );
    }

    this._deletedAt = new Date();
  }

  /**
   * 삭제 가능 여부 확인
   *
   * @returns deletable 속성 값
   */
  canBeDeleted(): boolean {
    return this.deletable;
  }

  // Private validation methods
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw createWorkspaceManagementError('INVALID_WORKSPACE_NAME');
    }

    if (name.trim().length > 100) {
      throw new WorkspaceManagementError(
        'INVALID_WORKSPACE_NAME',
        'Workspace name cannot exceed 100 characters'
      );
    }
  }

  private validateDescription(description: string | null): void {
    if (description && description.length > 500) {
      throw new WorkspaceManagementError(
        'INVALID_INPUT',
        'Workspace description cannot exceed 500 characters'
      );
    }
  }

  private validateDefaultDeletable(
    isDefault: boolean,
    deletable: boolean
  ): void {
    if (isDefault && deletable) {
      throw new WorkspaceManagementError(
        'DEFAULT_WORKSPACE_NOT_DELETABLE',
        'Default workspace cannot be deletable'
      );
    }
  }
}
