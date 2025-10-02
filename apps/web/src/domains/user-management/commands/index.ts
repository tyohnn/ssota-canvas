// apps/web/src/domains/user-management/commands/index.ts

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

export interface GetUserOrganizationsCommand {
  userId: string;
}

export interface SelectOrganizationCommand {
  userId: string;
  organizationId: string;
}
