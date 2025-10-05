// apps/web/src/domains/user-management/entities/user.entity.ts

import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export class User {
  constructor(
    public readonly id: UserId,
    private _email: UserEmail,
    private _name: string,
    private _avatarUrl: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get email(): UserEmail {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // 상태 변경 메서드
  updateProfile(name: string, avatarUrl: string | null): void {
    this._name = name;
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    this._email = email;
    this._updatedAt = new Date();
  }
}
