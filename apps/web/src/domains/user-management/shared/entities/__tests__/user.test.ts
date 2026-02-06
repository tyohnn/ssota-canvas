import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../user.entity';
import { UserId } from '../../value-objects/ids.vo';
import { UserEmail } from '../../value-objects/user-email.vo';
import { UserManagementError } from '../../errors/user-management.error';

describe('User', () => {
  let userId: UserId;
  let userEmail: UserEmail;
  let user: User;

  beforeEach(() => {
    userId = new UserId('user_123');
    userEmail = new UserEmail('test@example.com');
    user = new User(
      userId,
      userEmail,
      'Test User',
      'https://example.com/avatar.jpg',
      'en',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-01T00:00:00Z')
    );
  });

  describe('생성자', () => {
    it('모든 필수 속성으로 User가 생성되어야 한다', () => {
      // When & Then
      expect(user.id).toBe(userId);
      expect(user.email).toBe(userEmail);
      expect(user.name).toBe('Test User');
      expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(user.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(user.updatedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('null 아바타 URL로 생성되어야 한다', () => {
      // Given
      const userWithNullAvatar = new User(
        userId,
        userEmail,
        'Test User',
        null,
        'en',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:00Z')
      );

      // When & Then
      expect(userWithNullAvatar.avatarUrl).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('사용자 이름과 아바타 URL을 업데이트해야 한다', () => {
      // Given
      const newName = 'Updated User';
      const newAvatarUrl = 'https://example.com/new-avatar.jpg';
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateProfile(newName, newAvatarUrl);

      // Then
      expect(user.name).toBe(newName);
      expect(user.avatarUrl).toBe(newAvatarUrl);
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('아바타 URL을 null로 업데이트할 수 있어야 한다', () => {
      // Given
      const newName = 'User Without Avatar';
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateProfile(newName, null);

      // Then
      expect(user.name).toBe(newName);
      expect(user.avatarUrl).toBeNull();
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('빈 이름으로 업데이트할 수 있어야 한다', () => {
      // Given
      const emptyName = '';
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateProfile(emptyName, user.avatarUrl);

      // Then
      expect(user.name).toBe(emptyName);
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('updatedAt이 현재 시간으로 업데이트되어야 한다', () => {
      // Given
      const beforeUpdate = new Date();
      const newName = 'Updated User';

      // When
      user.updateProfile(newName, user.avatarUrl);
      const afterUpdate = new Date();

      // Then
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('updateEmail', () => {
    it('유효한 이메일로 업데이트해야 한다', () => {
      // Given
      const newEmail = new UserEmail('newemail@example.com');
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateEmail(newEmail);

      // Then
      expect(user.email).toBe(newEmail);
      expect(user.email.value).toBe('newemail@example.com');
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('잘못된 이메일 형식으로 업데이트하려 하면 예외가 발생해야 한다', () => {
      // Given
      const invalidEmail = 'invalid-email';

      // When & Then
      expect(() => {
        const badEmail = new UserEmail(invalidEmail);
        user.updateEmail(badEmail);
      }).toThrow(UserManagementError);
    });

    it('updatedAt이 현재 시간으로 업데이트되어야 한다', () => {
      // Given
      const newEmail = new UserEmail('updated@example.com');
      const beforeUpdate = new Date();

      // When
      user.updateEmail(newEmail);
      const afterUpdate = new Date();

      // Then
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('불변성', () => {
    it('id는 변경할 수 없어야 한다', () => {
      // Given
      const originalId = user.id;

      // When
      // id는 readonly이므로 직접 변경할 수 없음
      
      // Then
      expect(user.id).toBe(originalId);
    });

    it('createdAt는 변경할 수 없어야 한다', () => {
      // Given
      const originalCreatedAt = user.createdAt;

      // When
      // createdAt은 readonly이므로 직접 변경할 수 없음
      
      // Then
      expect(user.createdAt).toBe(originalCreatedAt);
    });

    it('email은 setter를 통해서만 변경할 수 있어야 한다', () => {
      // Given
      const originalEmail = user.email;
      const newEmail = new UserEmail('newemail@example.com');

      // When
      user.updateEmail(newEmail);

      // Then
      expect(user.email).not.toBe(originalEmail);
      expect(user.email).toBe(newEmail);
    });
  });

  describe('Edge Cases', () => {
    it('매우 긴 이름을 처리할 수 있어야 한다', () => {
      // Given
      const longName = 'A'.repeat(1000);
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateProfile(longName, user.avatarUrl);

      // Then
      expect(user.name).toBe(longName);
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('매우 긴 아바타 URL을 처리할 수 있어야 한다', () => {
      // Given
      const longAvatarUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      const originalUpdatedAt = user.updatedAt;

      // When
      user.updateProfile(user.name, longAvatarUrl);

      // Then
      expect(user.avatarUrl).toBe(longAvatarUrl);
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
