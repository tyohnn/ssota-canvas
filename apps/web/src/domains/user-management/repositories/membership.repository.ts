import { MembershipId, OrganizationId, UserId, UserEmail } from '../value-objects/ids.vo';
import { MembershipAggregate } from '../aggregates/membership.aggregate';

export interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByUserAndOrganization(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  findByOrganization(organizationId: OrganizationId): Promise<MembershipAggregate[]>;
  findByUser(userId: UserId): Promise<MembershipAggregate[]>;
  findByInviteeEmail(email: UserEmail): Promise<MembershipAggregate[]>;
  save(membership: MembershipAggregate): Promise<void>;
  delete(id: MembershipId): Promise<void>;
  findPendingInvitations(): Promise<MembershipAggregate[]>;
}

export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private db: any) {}

  async findById(id: MembershipId): Promise<MembershipAggregate | null> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.id', id.value);

    if (result.length === 0) return null;

    return this.mapToAggregate(result[0]);
  }

  async findByUserAndOrganization(
    userId: UserId,
    organizationId: OrganizationId
  ): Promise<MembershipAggregate | null> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.user_id', userId.value)
      .andWhere('memberships.organization_id', organizationId.value)
      .andWhere('memberships.deleted_at', null);

    if (result.length === 0) return null;

    return this.mapToAggregate(result[0]);
  }

  async findByOrganization(organizationId: OrganizationId): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.organization_id', organizationId.value)
      .andWhere('memberships.deleted_at', null);

    return result.map(row => this.mapToAggregate(row));
  }

  async findByUser(userId: UserId): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.user_id', userId.value)
      .andWhere('memberships.deleted_at', null);

    return result.map(row => this.mapToAggregate(row));
  }

  async findByInviteeEmail(email: UserEmail): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.invitee_email', email.value)
      .andWhere('memberships.deleted_at', null);

    return result.map(row => this.mapToAggregate(row));
  }

  async save(membership: MembershipAggregate): Promise<void> {
    const mem = membership.entity;
    await this.db
      .insert('memberships')
      .values({
        id: mem.id.value,
        organization_id: mem.organizationId.value,
        user_id: mem.userId?.value,
        role: mem.role,
        invited_by: mem.invitedBy?.value,
        invited_at: mem.invitedAt,
        joined_at: mem.joinedAt,
        status: mem.status,
        created_at: mem.createdAt,
        updated_at: mem.updatedAt,
        deleted_at: mem.deletedAt,
        invitee_email: mem.inviteeEmail?.value
      })
      .onConflict('id')
      .merge({
        user_id: mem.userId?.value,
        role: mem.role,
        invited_by: mem.invitedBy?.value,
        invited_at: mem.invitedAt,
        joined_at: mem.joinedAt,
        status: mem.status,
        updated_at: mem.updatedAt,
        deleted_at: mem.deletedAt,
        invitee_email: mem.inviteeEmail?.value
      });
  }

  async delete(id: MembershipId): Promise<void> {
    await this.db
      .update('memberships')
      .set({
        deleted_at: new Date(),
        updated_at: new Date()
      })
      .where('id', id.value);
  }

  async findPendingInvitations(): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from('memberships')
      .leftJoin('organizations', 'memberships.organization_id', 'organizations.id')
      .leftJoin('users', 'memberships.user_id', 'users.id')
      .where('memberships.status', 'pending')
      .andWhere('memberships.deleted_at', null);

    return result.map(row => this.mapToAggregate(row));
  }

  private mapToAggregate(result: any): MembershipAggregate {
    // DB 결과를 MembershipAggregate로 변환하는 로직
    // 실제로는 Organization, User 엔티티도 필요하지만 여기서는 임시로 처리
    const membership = {
      id: new MembershipId(result.id),
      organizationId: new OrganizationId(result.organization_id),
      userId: result.user_id ? new UserId(result.user_id) : null,
      role: result.role,
      invitedBy: result.invited_by ? new UserId(result.invited_by) : null,
      invitedAt: result.invited_at,
      joinedAt: result.joined_at,
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      deletedAt: result.deleted_at,
      inviteeEmail: result.invitee_email ? new UserEmail(result.invitee_email) : undefined
    };

    // 임시 Organization, User 객체 (실제로는 Repository에서 조회해야 함)
    const tempOrganization = {} as any;
    const tempUser = {} as any;

    return new MembershipAggregate(membership, tempOrganization, tempUser);
  }
}