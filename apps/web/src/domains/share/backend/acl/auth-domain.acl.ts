// apps/web/src/domains/share/infrastructure/acl/auth-domain.acl.ts

export interface AuthDomainAcl {
  isMember(userId: string): Promise<boolean>;
}
