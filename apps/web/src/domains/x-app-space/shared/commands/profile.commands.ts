import type { ProfileId } from '../value-objects/profile-id.vo';
import type { XUserId } from '../value-objects/x-user-id.vo';

export interface CreateProfileCommand {
  profileId: ProfileId;
  userId: XUserId;
  username: string;
  name?: string;
  profileImageUrl?: string;
  description?: string;
  followersCount?: number;
  followingCount?: number;
  tweetCount?: number;
}
