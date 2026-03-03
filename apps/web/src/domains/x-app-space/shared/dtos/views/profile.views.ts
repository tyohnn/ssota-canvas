export interface ProfileView {
  id: string;
  userId: string;
  username: string;
  name?: string;
  profileImageUrl?: string;
  description?: string;
  followersCount?: number;
  followingCount?: number;
  tweetCount?: number;
  createdAt: string;
  updatedAt: string;
}
