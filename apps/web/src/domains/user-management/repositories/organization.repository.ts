import { OrganizationId, UserId, OrganizationSlug } from '../value-objects/ids.vo';
import { OrganizationAggregate } from '../aggregates/organization.aggregate';

export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByClerkId(clerkId: string): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  findBySlug(slug: OrganizationSlug): Promise<OrganizationAggregate | null>;
  findDefaultByUserId(userId: UserId): Promise<OrganizationAggregate | null>;
  save(organization: OrganizationAggregate): Promise<void>;
  delete(id: OrganizationId): Promise<void>;
  findSoftDeleted(): Promise<OrganizationAggregate[]>;
  getUserOrganizations(userId: UserId): Promise<OrganizationAggregate[]>;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private db: any) {}

  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from('organizations')
      .leftJoin('memberships', 'organizations.id', 'memberships.organization_id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('organizations.id', id.value)
      .andWhere('organizations.deleted_at', null);

    if (result.length === 0) return null;

    return this.mapToAggregate(result);
  }

  async findByClerkId(clerkId: string): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from('organizations')
      .where('clerk_id', clerkId)
      .andWhere('deleted_at', null)
      .limit(1);

    if (result.length === 0) return null;

    const organization = this.mapToOrganizationEntity(result[0]);
    return new OrganizationAggregate(organization, []);
  }

  async findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]> {
    const result = await this.db
      .select()
      .from('organizations')
      .where('owner_id', ownerId.value)
      .andWhere('deleted_at', null)
      .orderBy('created_at');

    return result.map(row => {
      const organization = this.mapToOrganizationEntity(row);
      return new OrganizationAggregate(organization, []);
    });
  }

  async findBySlug(slug: OrganizationSlug): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from('organizations')
      .where('slug', slug.value)
      .andWhere('deleted_at', null)
      .limit(1);

    if (result.length === 0) return null;

    const organization = this.mapToOrganizationEntity(result[0]);
    return new OrganizationAggregate(organization, []);
  }

  async findDefaultByUserId(userId: UserId): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from('organizations')
      .innerJoin('memberships', 'organizations.id', 'memberships.organization_id')
      .where('memberships.user_id', userId.value)
      .andWhere('organizations.is_default', true)
      .andWhere('organizations.deleted_at', null)
      .andWhere('memberships.deleted_at', null)
      .limit(1);

    if (result.length === 0) return null;

    const organization = this.mapToOrganizationEntity(result[0]);
    return new OrganizationAggregate(organization, []);
  }

  async save(organization: OrganizationAggregate): Promise<void> {
    const org = organization.entity;
    await this.db
      .insert('organizations')
      .values({
        id: org.id.value,
        clerk_id: org.clerkId,
        name: org.name,
        slug: org.slug.value,
        owner_id: org.ownerId.value,
        is_default: org.isDefault,
        created_at: org.createdAt,
        updated_at: org.updatedAt,
        deleted_at: org.deletedAt
      })
      .onConflict('id')
      .merge({
        name: org.name,
        slug: org.slug.value,
        owner_id: org.ownerId.value,
        updated_at: org.updatedAt,
        deleted_at: org.deletedAt
      });
  }

  async delete(id: OrganizationId): Promise<void> {
    await this.db
      .update('organizations')
      .set({
        deleted_at: new Date(),
        updated_at: new Date()
      })
      .where('id', id.value);
  }

  async findSoftDeleted(): Promise<OrganizationAggregate[]> {
    const result = await this.db
      .select()
      .from('organizations')
      .where('deleted_at', 'IS NOT', null)
      .orderBy('deleted_at');

    return result.map(row => {
      const organization = this.mapToOrganizationEntity(row);
      return new OrganizationAggregate(organization, []);
    });
  }

  async getUserOrganizations(userId: UserId): Promise<OrganizationAggregate[]> {
    const result = await this.db
      .select()
      .from('organizations')
      .innerJoin('memberships', 'organizations.id', 'memberships.organization_id')
      .where('memberships.user_id', userId.value)
      .andWhere('organizations.deleted_at', null)
      .andWhere('memberships.deleted_at', null)
      .orderBy('organizations.created_at');

    return this.mapToAggregates(result);
  }

  private mapToAggregate(result: any[]): OrganizationAggregate {
    if (result.length === 0) {
      throw new Error('Cannot map empty result to OrganizationAggregate');
    }

    const firstRow = result[0];
    const organization = this.mapToOrganizationEntity(firstRow);

    const memberships = result
      .filter(row => row.membership_id)
      .reduce((acc, row) => {
        if (!acc.find(m => m.id === row.membership_id)) {
          acc.push(this.mapToMembershipEntity(row));
        }
        return acc;
      }, [] as any[]);

    return new OrganizationAggregate(organization, memberships);
  }

  private mapToAggregates(result: any[]): OrganizationAggregate[] {
    const orgGroups = result.reduce((acc, row) => {
      const orgId = row.organization_id;
      if (!acc[orgId]) {
        acc[orgId] = [];
      }
      acc[orgId].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.values(orgGroups).map(group => this.mapToAggregate(group));
  }

  private mapToOrganizationEntity(row: any): any {
    return {
      id: new OrganizationId(row.id),
      clerkId: row.clerk_id,
      name: row.name,
      slug: new OrganizationSlug(row.slug),
      ownerId: new UserId(row.owner_id),
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapToMembershipEntity(row: any): any {
    return {
      id: row.membership_id,
      organizationId: new OrganizationId(row.organization_id),
      userId: row.user_id ? new UserId(row.user_id) : null,
      role: row.role,
      invitedBy: row.invited_by ? new UserId(row.invited_by) : null,
      invitedAt: row.invited_at,
      joinedAt: row.joined_at,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      inviteeEmail: row.invitee_email
    };
  }
}