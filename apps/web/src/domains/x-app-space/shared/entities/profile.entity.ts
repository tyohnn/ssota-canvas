/**
 * Profile Entity
 *
 * X(트위터) 프로필 정보를 나타내는 도메인 엔티티
 */
import { XUserId } from '../value-objects/x-user-id.vo';

export class ProfileEntity {
  constructor(
    public readonly id: string,
    public readonly userId: XUserId,
    public readonly username: string,
    public readonly name: string | undefined,
    public readonly profileImageUrl: string | undefined,
    public readonly description: string | undefined,
    public readonly followersCount: number | undefined,
    public readonly followingCount: number | undefined,
    public readonly tweetCount: number | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static reconstitute(params: {
    id: string;
    userId: XUserId;
    username: string;
    name?: string;
    profileImageUrl?: string;
    description?: string;
    followersCount?: number;
    followingCount?: number;
    tweetCount?: number;
    createdAt: Date;
    updatedAt: Date;
  }): ProfileEntity {
    return new ProfileEntity(
      params.id,
      params.userId,
      params.username,
      params.name,
      params.profileImageUrl,
      params.description,
      params.followersCount,
      params.followingCount,
      params.tweetCount,
      params.createdAt,
      params.updatedAt
    );
  }
}
