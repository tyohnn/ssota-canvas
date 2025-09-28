import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserManagementError } from '../errors/user-management.error';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly clerkId: string,
    private _email: UserEmail,
    private _name: string,
    private _avatarUrl: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null
  ) {}

  // Getters
  get email() { return this._email; }
  get name() { return this._name; }
  get avatarUrl() { return this._avatarUrl; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }
  get isDeleted() { return this._deletedAt !== null; }

  // 상태 변경 메서드
  updateProfile(name: string, avatarUrl: string | null): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_DELETED', 'Cannot update deleted user');
    }
    this._name = name;
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_DELETED', 'Cannot update deleted user');
    }
    this._email = email;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_ALREADY_DELETED', 'User is already deleted');
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted) {
      throw new UserManagementError('USER_NOT_DELETED', 'User is not deleted');
    }
    this._deletedAt = null;
    this._updatedAt = new Date();
  }
}