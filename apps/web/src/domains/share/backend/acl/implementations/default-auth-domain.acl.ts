// apps/web/src/domains/share/backend/acl/implementations/default-auth-domain.acl.ts

import { AuthDomainAcl } from '../auth-domain.acl';

export class DefaultAuthDomainAcl implements AuthDomainAcl {
  async isMember(userId: string): Promise<boolean> {
    // TODO: Integrate with User Management Domain
    return Boolean(userId);
  }
}
