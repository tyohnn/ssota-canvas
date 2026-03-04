import type { XPostEntities } from '../../types/post-metadata.types';

/**
 * Post View (plain object for DTOs)
 */
export interface PostView {
  id: string;
  postId: string;
  text: string;
  articleUrl?: string;
  attachmentUrls: string[];
  authorUsername?: string;
  authorName?: string;
  authorProfileImageUrl?: string;
  postedAt?: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  createdAt: string;
  updatedAt: string;
  /** Entities for linking mentions, hashtags, URLs (Display Requirements). Present only when fetched fresh. */
  entities?: XPostEntities;
}
