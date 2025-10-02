// apps/web/src/domains/user-management/repositories/interfaces/user.repository.interface.ts

import { UserAggregate } from '../../aggregates/user.aggregate';
import { UserId } from '../../value-objects/ids.vo';
import { UserEmail } from '../../value-objects/user-email.vo';

export interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  findByEmail(email: UserEmail): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<void>;
  delete(id: UserId): Promise<void>;
}
