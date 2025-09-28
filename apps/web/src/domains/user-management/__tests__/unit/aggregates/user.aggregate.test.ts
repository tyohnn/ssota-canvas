import { UserAggregate } from '../../../aggregates/user.aggregate';
import { User } from '../../../entities/user.entity';
import { UserId } from '../../../value-objects/user-id.vo';
import { UserEmail } from '../../../value-objects/user-email.vo';
import { UserCreatedEvent, UserUpdatedEvent, UserLoggedInEvent, UserLoggedOutEvent } from '../../../events';
import { UserManagementError } from '../../../errors/user-management.error';

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

  describe('loginUser', () => {
    let aggregate: UserAggregate;

    beforeEach(() => {
      const user = new User(
        UserId.generate(),
        'clerk_123',
        new UserEmail('test@example.com'),
        'John Doe',
        'https://example.com/avatar.jpg',
        new Date(),
        new Date()
      );
      aggregate = new UserAggregate(user);
    });

    it('should create UserLoggedInEvent for valid user', () => {
      const clerkUserId = 'clerk_123';
      const sessionId = 'session_123';
      const loginMethod = 'email';

      const event = aggregate.loginUser(clerkUserId, sessionId, loginMethod);

      expect(event).toBeInstanceOf(UserLoggedInEvent);
      expect(event.userId).toBe(aggregate.id);
      expect(event.clerkUserId).toBe(clerkUserId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.loginMethod).toBe(loginMethod);
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when user is deleted', () => {
      aggregate.entity.softDelete();

      expect(() => {
        aggregate.loginUser('clerk_123', 'session_123', 'email');
      }).toThrow(UserManagementError);
    });
  });

  describe('logoutUser', () => {
    let aggregate: UserAggregate;

    beforeEach(() => {
      const user = new User(
        UserId.generate(),
        'clerk_123',
        new UserEmail('test@example.com'),
        'John Doe',
        'https://example.com/avatar.jpg',
        new Date(),
        new Date()
      );
      aggregate = new UserAggregate(user);
    });

    it('should create UserLoggedOutEvent', () => {
      const sessionId = 'session_123';

      const event = aggregate.logoutUser(sessionId);

      expect(event).toBeInstanceOf(UserLoggedOutEvent);
      expect(event.userId).toBe(aggregate.id);
      expect(event.sessionId).toBe(sessionId);
      expect(event.timestamp).toBeInstanceOf(Date);
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