// apps/web/src/domains/user-management/commands/index.ts

export interface CreateUserProfileCommand {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language?: string;
}
