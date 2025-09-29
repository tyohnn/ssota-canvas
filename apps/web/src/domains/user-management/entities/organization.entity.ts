import { OrganizationId, UserId, OrganizationSlug } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';

export class Organization {
  constructor(
    public readonly id: OrganizationId,
    public readonly clerkId: string,
    private _name: string,
    private _slug: OrganizationSlug,
    private _ownerId: UserId,
    private _isDefault: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null
  ) {}

  // Getters
  get name() { return this._name; }
  get slug() { return this._slug; }
  get ownerId() { return this._ownerId; }
  get isDefault() { return this._isDefault; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }
  get isDeleted() { return this._deletedAt !== null; }

  // 상태 변경 메서드
  updateName(name: string): void {
    if (this.isDeleted) {
      throw new UserManagementError(
        'ORGANIZATION_DELETED',
        'Cannot update deleted organization'
      );
    }
    this._name = name;
    this._updatedAt = new Date();
  }

  updateSlug(slug: OrganizationSlug): void {
    if (this.isDeleted) {
      throw new UserManagementError(
        'ORGANIZATION_DELETED',
        'Cannot update deleted organization'
      );
    }
    this._slug = slug;
    this._updatedAt = new Date();
  }

  transferOwnership(newOwnerId: UserId): void {
    if (this.isDeleted) {
      throw new UserManagementError(
        'ORGANIZATION_DELETED',
        'Cannot transfer ownership of deleted organization'
      );
    }
    if (this._isDefault) {
      throw new UserManagementError(
        'CANNOT_TRANSFER_DEFAULT',
        'Cannot transfer ownership of default organization'
      );
    }
    this._ownerId = newOwnerId;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new UserManagementError(
        'ORGANIZATION_ALREADY_DELETED',
        'Organization is already deleted'
      );
    }
    if (this._isDefault) {
      throw new UserManagementError(
        'CANNOT_DELETE_DEFAULT',
        'Cannot delete default organization'
      );
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted) {
      throw new UserManagementError(
        'ORGANIZATION_NOT_DELETED',
        'Organization is not deleted'
      );
    }
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  // 30일 후 완전 삭제 여부 확인
  canBePermanentlyDeleted(): boolean {
    if (!this.isDeleted) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this._deletedAt! < thirtyDaysAgo;
  }
}