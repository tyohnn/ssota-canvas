/**
 * X API Post Entities (for linking mentions, hashtags, URLs - Display Requirements)
 */
export interface XPostEntityMention {
  start: number;
  end: number;
  username: string;
}

export interface XPostEntityHashtag {
  start: number;
  end: number;
  tag: string;
}

export interface XPostEntityUrl {
  start: number;
  end: number;
  url: string;
  expanded_url?: string;
  display_url?: string;
}

export interface XPostEntities {
  mentions?: XPostEntityMention[];
  hashtags?: XPostEntityHashtag[];
  urls?: XPostEntityUrl[];
}

/**
 * X API Post Metadata (from API response)
 */
export interface PostMetadata {
  text: string;
  articleUrl?: string;
  attachmentUrls?: string[];
  authorId?: string; // X User ID (author_id)
  authorUsername?: string;
  authorName?: string;
  authorProfileImageUrl?: string;
  authorDescription?: string;
  authorFollowersCount?: number;
  authorFollowingCount?: number;
  authorTweetCount?: number;
  postedAt?: Date;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
  entities?: XPostEntities;
}
