// apps/web/src/domains/organization-management/shared/entities/organization.entity.ts

import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { OrganizationType } from '../types';

export class Organization {
  constructor(
    public readonly id: OrganizationId,
    private _name: string,
    private _organizationType: OrganizationType,
    private _ownerId: UserId,
    private _isDefault: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _iconUrl: string | null = null
  ) {}

  // Getters
  get name(): string {
    return this._name;
  }

  get organizationType(): OrganizationType {
    return this._organizationType;
  }

  get ownerId(): UserId {
    return this._ownerId;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get iconUrl(): string | null {
    return this._iconUrl;
  }

  // 상태 변경 메서드
  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateIcon(iconUrl: string | null): void {
    this._iconUrl = iconUrl;
    this._updatedAt = new Date();
  }

  transferOwnership(newOwnerId: UserId): void {
    this._ownerId = newOwnerId;
    this._updatedAt = new Date();
  }
}

