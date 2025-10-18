// apps/web/src/domains/organization-management/backend/services/index.ts

// Services
export { DefaultOrganizationCrudService } from './organization-crud.service';
export { DefaultOrganizationInvitationService } from './organization-invitation.service';
export { DefaultOrganizationMemberService } from './organization-member.service';
export { DefaultOrganizationQueryService } from './organization-query.service';

// Interfaces
export type { OrganizationCrudService } from './interfaces/organization-crud.service.interface';
export type { OrganizationInvitationService } from './interfaces/organization-invitation.service.interface';
export type { OrganizationMemberService } from './interfaces/organization-member.service.interface';
export type { OrganizationQueryService } from './interfaces/organization-query.service.interface';

// Common Types
export type {
  CreateDefaultOrganizationResult,
  CreateOrganizationWithWorkspaceResult,
  ServiceResult,
} from './interfaces/common.types';
