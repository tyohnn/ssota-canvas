import { UserEmail } from '../../../value-objects/user-email.vo';
import { UserManagementError } from '../../../errors/user-management.error';

describe('UserEmail', () => {
  describe('constructor', () => {
    it('should create a valid email', () => {
      const email = new UserEmail('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => new UserEmail('invalid-email')).toThrow(UserManagementError);
      expect(() => new UserEmail('')).toThrow(UserManagementError);
      expect(() => new UserEmail('test@')).toThrow(UserManagementError);
    });

    it('should throw error for email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => new UserEmail(longEmail)).toThrow(UserManagementError);
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = new UserEmail('test@example.com');
      const email2 = new UserEmail('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new UserEmail('test@example.com');
      const email2 = new UserEmail('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('getDomain', () => {
    it('should return the domain part of the email', () => {
      const email = new UserEmail('user@company.com');
      expect(email.getDomain()).toBe('company.com');
    });
  });
});