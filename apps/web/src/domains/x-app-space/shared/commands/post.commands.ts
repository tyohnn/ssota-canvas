/**
 * Post Commands
 */
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { PostId } from '../value-objects/post-id.vo';
import type { PostSlug } from '../value-objects/post-slug.vo';

export interface CreatePostCommand {
  postId: PostId;
  postSlug: PostSlug;
  text: string;
  articleUrl?: string;
  attachmentUrls?: string[];
  profileId?: string; // Profile aggregate UUID
  postedAt?: Date;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
  userId: UserId;
}
