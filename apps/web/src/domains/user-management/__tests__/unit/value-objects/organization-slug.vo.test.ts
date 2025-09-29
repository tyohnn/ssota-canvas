import { OrganizationSlug } from '../../value-objects/organization-slug.vo';

describe('OrganizationSlug', () => {
  describe('constructor', () => {
    it('should create valid slug', () => {
      const slug = new OrganizationSlug('valid-slug-123');
      expect(slug.value).toBe('valid-slug-123');
    });

    it('should throw error for slug too short', () => {
      expect(() => {
        new OrganizationSlug('ab');
      }).toThrow('Slug must be between 3 and 50 characters');
    });

    it('should throw error for slug too long', () => {
      expect(() => {
        new OrganizationSlug('a'.repeat(51));
      }).toThrow('Slug must be between 3 and 50 characters');
    });

    it('should throw error for invalid characters', () => {
      expect(() => {
        new OrganizationSlug('invalid_slug!');
      }).toThrow('Slug can only contain lowercase letters, numbers, and hyphens');
    });

    it('should throw error for uppercase letters', () => {
      expect(() => {
        new OrganizationSlug('Invalid-Slug');
      }).toThrow('Slug can only contain lowercase letters, numbers, and hyphens');
    });
  });

  describe('fromName', () => {
    it('should create slug from name', () => {
      const slug = OrganizationSlug.fromName('My Test Organization');
      expect(slug.value).toBe('my-test-organization');
    });

    it('should handle special characters', () => {
      const slug = OrganizationSlug.fromName('Organization!@#$%');
      expect(slug.value).toBe('organization');
    });

    it('should handle multiple spaces', () => {
      const slug = OrganizationSlug.fromName('My   Test   Organization');
      expect(slug.value).toBe('my-test-organization');
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(60);
      const slug = OrganizationSlug.fromName(longName);
      expect(slug.value.length).toBeLessThanOrEqual(50);
    });
  });

  describe('equals', () => {
    it('should return true for equal slugs', () => {
      const slug1 = new OrganizationSlug('test-slug');
      const slug2 = new OrganizationSlug('test-slug');
      expect(slug1.equals(slug2)).toBe(true);
    });

    it('should return false for different slugs', () => {
      const slug1 = new OrganizationSlug('test-slug');
      const slug2 = new OrganizationSlug('different-slug');
      expect(slug1.equals(slug2)).toBe(false);
    });
  });
});