import type { ProfileAggregate } from '../../../shared/aggregates/profile.aggregate';

export interface IProfileRepository {
  create(profileAggregate: ProfileAggregate): Promise<void>;
  findById(id: string): Promise<ProfileAggregate | null>;
  findByUserId(userId: string): Promise<ProfileAggregate | null>;
}
