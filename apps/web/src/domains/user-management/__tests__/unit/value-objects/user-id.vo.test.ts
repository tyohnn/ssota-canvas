import { UserId } from '../../../value-objects/user-id.vo';
import { UserManagementError } from '../../../errors/user-management.error';

describe('UserId', () => {
  describe('constructor', () => {
    it('should create a valid user ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = new UserId(uuid);
      expect(userId.value).toBe(uuid);
    });

    it('should throw error for empty user ID', () => {
      expect(() => new UserId('')).toThrow(UserManagementError);
      expect(() => new UserId('   ')).toThrow(UserManagementError);
    });
  });

  describe('equals', () => {
    it('should return true for equal user IDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1 = new UserId(uuid);
      const userId2 = new UserId(uuid);
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const userId1 = new UserId('123e4567-e89b-12d3-a456-426614174000');
      const userId2 = new UserId('987e6543-e21c-34d5-b678-9876543210ab');
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate a valid UUID', () => {
      const userId = UserId.generate();
      expect(userId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate different IDs each time', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();
      expect(userId1.value).not.toBe(userId2.value);
    });
  });
});