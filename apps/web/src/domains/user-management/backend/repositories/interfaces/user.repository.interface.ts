// apps/web/src/domains/user-management/repositories/interfaces/user.repository.interface.ts

import { UserProfile } from '@/domains/user-management/shared/types';
import { UserAggregate } from '../../../shared/aggregates/user.aggregate';
import { UserId } from '../../../shared/value-objects/ids.vo';
import { UserEmail } from '../../../shared/value-objects/user-email.vo';

export interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  findByEmail(email: UserEmail): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<void>;
  delete(id: UserId): Promise<void>;
  getUserProfile(userId: UserId): Promise<UserProfile | undefined>;
}
