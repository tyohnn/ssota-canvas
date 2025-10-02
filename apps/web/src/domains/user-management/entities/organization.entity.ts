// apps/web/src/domains/user-management/entities/organization.entity.ts

import { OrganizationId, UserId } from '../value-objects/ids.vo';

export class Organization {
  constructor(
    public readonly id: OrganizationId,
    private _name: string,
    private _ownerId: UserId,
    private _isDefault: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get name(): string {
    return this._name;
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

  // 상태 변경 메서드
  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }
}
