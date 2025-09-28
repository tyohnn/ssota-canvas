import { UserAggregate } from '../../../aggregates/user.aggregate';
import { User } from '../../../entities/user.entity';
import { UserId } from '../../../value-objects/user-id.vo';
import { UserEmail } from '../../../value-objects/user-email.vo';
import { UserCreatedEvent, UserUpdatedEvent } from '../../../events';

describe('UserAggregate', () => {
  describe('createFromClerkUser', () => {
    it('should create user aggregate from clerk user data', () => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      const aggregate = UserAggregate.createFromClerkUser(clerkUser);

      expect(aggregate.id.value).toBeDefined();
      expect(aggregate.entity.clerkId).toBe('clerk_123');
      expect(aggregate.entity.email.value).toBe('test@example.com');
      expect(aggregate.entity.name).toBe('John Doe');
      expect(aggregate.entity.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should handle missing names gracefully', () => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: '',
        lastName: '',
        imageUrl: null
      };

      const aggregate = UserAggregate.createFromClerkUser(clerkUser);

      expect(aggregate.entity.name).toBe('');
      expect(aggregate.entity.avatarUrl).toBeNull();
    });
  });

  describe('updateFromClerkUser', () => {
    let aggregate: UserAggregate;

    beforeEach(() => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      aggregate = UserAggregate.createFromClerkUser(clerkUser);
    });

    it('should return UserUpdatedEvent when there are changes', () => {
      const updatedClerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'new@example.com' }],
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: 'https://example.com/new-avatar.jpg'
      };

      const event = aggregate.updateFromClerkUser(updatedClerkUser);

      expect(event).toBeInstanceOf(UserUpdatedEvent);
      expect(event.email.value).toBe('new@example.com');
      expect(event.name).toBe('Jane Smith');
    });

    it('should return UserCreatedEvent when there are no changes', () => {
      const sameClerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      const event = aggregate.updateFromClerkUser(sameClerkUser);

      expect(event).toBeInstanceOf(UserCreatedEvent);
      expect(event.email.value).toBe('test@example.com');
      expect(event.name).toBe('John Doe');
    });

    it('should update user entity when there are changes', () => {
      const updatedClerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'new@example.com' }],
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: 'https://example.com/new-avatar.jpg'
      };

      aggregate.updateFromClerkUser(updatedClerkUser);

      expect(aggregate.entity.email.value).toBe('new@example.com');
      expect(aggregate.entity.name).toBe('Jane Smith');
      expect(aggregate.entity.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('canJoinOrganization', () => {
    let aggregate: UserAggregate;
    const orgId = UserId.generate();

    beforeEach(() => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: null
      };

      aggregate = UserAggregate.createFromClerkUser(clerkUser);
    });

    it('should return false if user is deleted', () => {
      aggregate.entity.softDelete();

      const result = aggregate.canJoinOrganization(orgId);

      expect(result).toBe(false);
    });

    it('should return false if user is already a member', () => {
      const membership = {
        organizationId: orgId,
        isDeleted: false
      };

      // Mock the memberships property
      Object.defineProperty(aggregate, 'memberships', {
        value: [membership],
        writable: true
      });

      const result = aggregate.canJoinOrganization(orgId);

      expect(result).toBe(false);
    });

    it('should return true if user can join organization', () => {
      const result = aggregate.canJoinOrganization(orgId);

      expect(result).toBe(true);
    });
  });

  describe('getDefaultOrganization', () => {
    let aggregate: UserAggregate;

    beforeEach(() => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: null
      };

      aggregate = UserAggregate.createFromClerkUser(clerkUser);
    });

    it('should return default organization if exists', () => {
      const defaultMembership = {
        isDefault: true,
        isDeleted: false
      };

      Object.defineProperty(aggregate, 'memberships', {
        value: [defaultMembership],
        writable: true
      });

      const result = aggregate.getDefaultOrganization();

      expect(result).toBe(defaultMembership);
    });

    it('should return null if no default organization', () => {
      Object.defineProperty(aggregate, 'memberships', {
        value: [],
        writable: true
      });

      const result = aggregate.getDefaultOrganization();

      expect(result).toBeNull();
    });
  });
});