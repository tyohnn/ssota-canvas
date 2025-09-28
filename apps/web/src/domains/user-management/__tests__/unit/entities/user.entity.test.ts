import { User } from '../../../entities/user.entity';
import { UserId } from '../../../value-objects/user-id.vo';
import { UserEmail } from '../../../value-objects/user-email.vo';
import { UserManagementError } from '../../../errors/user-management.error';

describe('User', () => {
  const userId = UserId.generate();
  const email = new UserEmail('test@example.com');
  const name = 'Test User';
  const avatarUrl = 'https://example.com/avatar.jpg';
  const createdAt = new Date('2024-01-01T00:00:00Z');
  const updatedAt = new Date('2024-01-01T00:00:00Z');

  let user: User;

  beforeEach(() => {
    user = new User(userId, 'clerk_123', email, name, avatarUrl, createdAt, updatedAt);
  });

  describe('constructor', () => {
    it('should create a user with all properties', () => {
      expect(user.id).toEqual(userId);
      expect(user.clerkId).toBe('clerk_123');
      expect(user.email).toEqual(email);
      expect(user.name).toBe(name);
      expect(user.avatarUrl).toBe(avatarUrl);
      expect(user.createdAt).toEqual(createdAt);
      expect(user.updatedAt).toEqual(updatedAt);
      expect(user.isDeleted).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update name and avatar', () => {
      const newName = 'Updated Name';
      const newAvatar = 'https://example.com/new-avatar.jpg';

      user.updateProfile(newName, newAvatar);

      expect(user.name).toBe(newName);
      expect(user.avatarUrl).toBe(newAvatar);
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay
      user.updateProfile('New Name', null);

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should throw error when updating deleted user', () => {
      user.softDelete();

      expect(() => user.updateProfile('New Name', null)).toThrow(UserManagementError);
    });
  });

  describe('updateEmail', () => {
    it('should update email', () => {
      const newEmail = new UserEmail('new@example.com');

      user.updateEmail(newEmail);

      expect(user.email).toEqual(newEmail);
    });

    it('should update updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay
      const newEmail = new UserEmail('new@example.com');

      user.updateEmail(newEmail);

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should throw error when updating deleted user', () => {
      user.softDelete();
      const newEmail = new UserEmail('new@example.com');

      expect(() => user.updateEmail(newEmail)).toThrow(UserManagementError);
    });
  });

  describe('softDelete', () => {
    it('should mark user as deleted', () => {
      user.softDelete();

      expect(user.isDeleted).toBe(true);
      expect(user.deletedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp', async () => {
      const beforeDelete = new Date();
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay

      user.softDelete();

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
    });

    it('should throw error when deleting already deleted user', () => {
      user.softDelete();

      expect(() => user.softDelete()).toThrow(UserManagementError);
    });
  });

  describe('restore', () => {
    it('should restore deleted user', () => {
      user.softDelete();
      expect(user.isDeleted).toBe(true);

      user.restore();

      expect(user.isDeleted).toBe(false);
      expect(user.deletedAt).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      user.softDelete();
      const beforeRestore = new Date();
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay

      user.restore();

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeRestore.getTime());
    });

    it('should throw error when restoring non-deleted user', () => {
      expect(() => user.restore()).toThrow(UserManagementError);
    });
  });
});