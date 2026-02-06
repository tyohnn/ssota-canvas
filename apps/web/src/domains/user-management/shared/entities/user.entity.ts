// apps/web/src/domains/user-management/entities/user.entity.ts

import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import type { BetaStatus } from '@/db/schema';
import type { BetaApplicationData } from '../types/beta.types';

export class User {
  constructor(
    public readonly id: UserId,
    private _email: UserEmail,
    private _name: string,
    private _avatarUrl: string | null,
    private _language: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    // Beta fields (optional) - Beta feature가 제거되어도 User entity 핵심 로직은 영향 없음
    private _betaStatus?: BetaStatus,
    private _betaApplication?: BetaApplicationData | null
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

  get language(): string {
    return this._language;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Beta getters (optional)
  get betaStatus(): BetaStatus | undefined {
    return this._betaStatus;
  }

  get betaApplication(): BetaApplicationData | null | undefined {
    return this._betaApplication;
  }

  // 상태 변경 메서드
  updateProfile(name: string, avatarUrl: string | null, language?: string): void {
    this._name = name;
    this._avatarUrl = avatarUrl;
    if (language !== undefined) {
      this._language = language;
    }
    this._updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    this._email = email;
    this._updatedAt = new Date();
  }
}
