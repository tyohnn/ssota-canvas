// apps/web/src/domains/user-management/commands/index.ts

import { OrganizationType } from '../types';

export interface CreateUserProfileCommand {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface CreateDefaultOrganizationCommand {
  userId: string;
  organizationName: string;
}

export interface CreateNewOrganizationCommand {
  name: string;
  organizationType: OrganizationType;
  ownerId: string;
}

export interface GetUserOrganizationsCommand {
  userId: string;
}
