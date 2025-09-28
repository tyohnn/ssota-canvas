import { UserManagementService } from '../../../services/user-management.service';
import { DrizzleUserRepository } from '../../../repositories/user.repository';
import { UserManagementError } from '../../../errors/user-management.error';

import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ClerkService
const mockClerkService = {
  getUser: vi.fn()
};

describe('UserManagementService Integration', () => {
  let service: UserManagementService;
  let userRepository: DrizzleUserRepository;

  beforeEach(() => {
    userRepository = new DrizzleUserRepository();
    service = new UserManagementService(userRepository, mockClerkService as any);
    vi.clearAllMocks();
  });

  describe('syncUserFromClerk', () => {
    it('should create new user when user does not exist in database', async () => {
      const clerkUserId = 'clerk_123';
      const mockClerkUser = {
        id: clerkUserId,
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      // Mock Clerk service to return user data
      mockClerkService.getUser.mockResolvedValue(mockClerkUser);

      // Mock repository to return null (user not found)
      const findByClerkIdSpy = vi.spyOn(userRepository, 'findByClerkId').mockResolvedValue(null);

      // Mock repository save method
      const saveSpy = vi.spyOn(userRepository, 'save');
      saveSpy.mockResolvedValue();

      const result = await service.syncUserFromClerk(clerkUserId);

      expect(result.success).toBe(true);
      expect(saveSpy).toHaveBeenCalled();
      expect(findByClerkIdSpy).toHaveBeenCalledWith(clerkUserId);
    });

    it('should update existing user when user exists in database', async () => {
      const clerkUserId = 'clerk_123';
      const mockClerkUser = {
        id: clerkUserId,
        emailAddresses: [{ emailAddress: 'updated@example.com' }],
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: 'https://example.com/new-avatar.jpg'
      };

      // Mock Clerk service to return updated user data
      mockClerkService.getUser.mockResolvedValue(mockClerkUser);

      // Mock repository to return existing user
      const clerkId = 'clerk_123';
      const existingUser = {
        id: { value: 'user_123' },
        entity: {
          clerkId,
          email: { value: 'test@example.com' },
          name: 'John Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          updateProfile: vi.fn(),
          updateEmail: vi.fn()
        }
      };

      const findByClerkIdSpy = vi.spyOn(userRepository, 'findByClerkId');
      findByClerkIdSpy.mockResolvedValue(existingUser as any);

      // Mock repository save method
      const saveSpy = vi.spyOn(userRepository, 'save');
      saveSpy.mockResolvedValue();

      const result = await service.syncUserFromClerk(clerkUserId);

      expect(result.success).toBe(true);
      expect(saveSpy).toHaveBeenCalled();
      expect(findByClerkIdSpy).toHaveBeenCalledWith(clerkUserId);
    });

    it('should return error when Clerk user is not found', async () => {
      const clerkUserId = 'nonexistent_clerk_id';

      // Mock Clerk service to return null
      mockClerkService.getUser.mockResolvedValue(null);

      const result = await service.syncUserFromClerk(clerkUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('USER_NOT_FOUND');
      }
    });

    it('should return error when Clerk service fails', async () => {
      const clerkUserId = 'clerk_123';

      // Mock Clerk service to throw error
      mockClerkService.getUser.mockRejectedValue(new Error('Clerk API error'));

      const result = await service.syncUserFromClerk(clerkUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CLERK_SYNC_FAILED');
      }
    });
  });

  describe('syncClerkUser', () => {
    it('should sync user creation event', async () => {
      const command = {
        clerkId: 'clerk_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg',
        status: 'active' as const,
        metadata: {},
        webhookType: 'user.created' as const
      };

      // Mock repository save method
      const saveSpy = vi.spyOn(userRepository, 'save');
      saveSpy.mockResolvedValue();

      const result = await service.syncClerkUser(command);

      expect(result.success).toBe(true);
      expect(saveSpy).toHaveBeenCalled();
      if (result.success) {
        expect(result.data.clerkId).toBe('clerk_123');
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.status).toBe('active');
      }
    });

    it('should handle user deletion event', async () => {
      const command = {
        clerkId: 'clerk_123',
        email: 'test@example.com',
        status: 'soft_deleted' as const,
        metadata: {},
        webhookType: 'user.deleted' as const
      };

      // Mock existing user for deletion
      const existingUser = {
        entity: {
          softDelete: vi.fn()
        }
      };

      const findByClerkIdSpy = vi.spyOn(userRepository, 'findByClerkId');
      findByClerkIdSpy.mockResolvedValue(existingUser as any);

      const saveSpy = vi.spyOn(userRepository, 'save');
      saveSpy.mockResolvedValue();

      const result = await service.syncClerkUser(command);

      expect(result.success).toBe(true);
      expect(existingUser.entity.softDelete).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});