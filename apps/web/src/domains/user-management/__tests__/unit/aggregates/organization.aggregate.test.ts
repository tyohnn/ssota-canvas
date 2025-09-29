import { OrganizationAggregate, CreateDefaultOrganizationCommand, DefaultOrganizationCreatedEvent } from '../../aggregates/organization.aggregate';
import { OrganizationId, UserId, OrganizationSlug } from '../../value-objects/ids.vo';

describe('OrganizationAggregate', () => {
  describe('createDefaultOrganization', () => {
    it('should create default organization successfully', () => {
      const command: CreateDefaultOrganizationCommand = {
        userId: new UserId('user-123'),
        userEmail: 'test@example.com',
        userName: 'Test User',
        clerkUserId: 'clerk-123',
        timestamp: new Date()
      };

      const result = OrganizationAggregate.createDefaultOrganization(command);

      expect(result.organization).toBeDefined();
      expect(result.event).toBeInstanceOf(DefaultOrganizationCreatedEvent);
      expect(result.event.userId).toEqual(command.userId);
      expect(result.event.organizationName).toBe("Test User의 개인 조직");
    });

    it('should generate unique organization ID', () => {
      const command: CreateDefaultOrganizationCommand = {
        userId: new UserId('user-123'),
        userEmail: 'test@example.com',
        userName: 'Test User',
        clerkUserId: 'clerk-123',
        timestamp: new Date()
      };

      const result1 = OrganizationAggregate.createDefaultOrganization(command);
      const result2 = OrganizationAggregate.createDefaultOrganization(command);

      expect(result1.organization.id).not.toEqual(result2.organization.id);
    });
  });

  describe('softDelete', () => {
    it('should soft delete organization successfully', () => {
      const organization = OrganizationAggregate.createDefault({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      const deleteEvent = organization.softDelete(new UserId('owner-123'));

      expect(deleteEvent).toBeDefined();
      expect(deleteEvent.organizationName).toBe('Test Organization');
      expect(organization.entity.isDeleted).toBe(true);
    });

    it('should prevent deletion of default organization', () => {
      const organization = OrganizationAggregate.createDefault({
        name: 'Default Organization',
        slug: new OrganizationSlug('default-org'),
        clerkId: 'clerk-default-123',
        ownerId: new UserId('owner-123')
      });

      expect(() => {
        organization.softDelete(new UserId('owner-123'));
      }).toThrow('Cannot delete default organization');
    });

    it('should require owner permission for deletion', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      expect(() => {
        organization.softDelete(new UserId('other-user-123'));
      }).toThrow('Only owner can delete organization');
    });
  });

  describe('restoreOrganization', () => {
    it('should restore organization successfully', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      // First soft delete
      organization.softDelete(new UserId('owner-123'));
      expect(organization.entity.isDeleted).toBe(true);

      // Then restore
      const restoreEvent = organization.restoreOrganization(new UserId('owner-123'));
      expect(restoreEvent).toBeDefined();
      expect(organization.entity.isDeleted).toBe(false);
    });

    it('should prevent restore of non-deleted organization', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      expect(() => {
        organization.restoreOrganization(new UserId('owner-123'));
      }).toThrow('Organization is not deleted');
    });

    it('should require owner permission for restore', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      organization.softDelete(new UserId('owner-123'));

      expect(() => {
        organization.restoreOrganization(new UserId('other-user-123'));
      }).toThrow('Only owner can restore organization');
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership successfully', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      const transferEvent = organization.transferOwnership(
        new UserId('new-owner-123'),
        new UserId('owner-123')
      );

      expect(transferEvent).toBeDefined();
      expect(transferEvent.newOwnerId.value).toBe('new-owner-123');
      expect(organization.ownerId.value).toBe('new-owner-123');
    });

    it('should prevent ownership transfer of default organization', () => {
      const organization = OrganizationAggregate.createDefault({
        name: 'Default Organization',
        slug: new OrganizationSlug('default-org'),
        clerkId: 'clerk-default-123',
        ownerId: new UserId('owner-123')
      });

      expect(() => {
        organization.transferOwnership(
          new UserId('new-owner-123'),
          new UserId('owner-123')
        );
      }).toThrow('Cannot transfer ownership of default organization');
    });

    it('should require current owner permission', () => {
      const organization = OrganizationAggregate.create({
        name: 'Test Organization',
        slug: new OrganizationSlug('test-org'),
        clerkId: 'clerk-org-123',
        ownerId: new UserId('owner-123')
      });

      expect(() => {
        organization.transferOwnership(
          new UserId('new-owner-123'),
          new UserId('other-user-123')
        );
      }).toThrow('Only current owner can transfer ownership');
    });
  });
});