// apps/web/src/domains/organization-management/backend/repositories/interfaces/invitation.repository.interface.ts

import { InvitationAggregate } from '../../../shared/aggregates/invitation.aggregate';
import {
  InvitationId,
  OrganizationId,
  UserId,
} from '../../../shared/value-objects/ids.vo';

export interface InvitationRepository {
  findById(id: InvitationId): Promise<InvitationAggregate | null>;
  findByOrganizationId(
    organizationId: OrganizationId
  ): Promise<InvitationAggregate[]>;
  findByInviteeEmail(
    email: string,
    organizationId: OrganizationId
  ): Promise<InvitationAggregate | null>;
  findByInviteeUserId(userId: UserId): Promise<InvitationAggregate[]>;
  findPendingByOrganizationId(
    organizationId: OrganizationId
  ): Promise<InvitationAggregate[]>;
  save(invitation: InvitationAggregate): Promise<void>;
  delete(id: InvitationId): Promise<void>;
}
