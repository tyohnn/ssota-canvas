import type React from 'react';

/**
 * X Block Types (minimal, package-agnostic)
 */

/** Entities for linking mentions, hashtags, URLs (X Display Requirements) */
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

export interface XMetadata {
  postId: string;
  text: string;
  authorUsername?: string;
  authorName?: string;
  authorProfileImageUrl?: string;
  postedAt?: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  /** Entities for linking mentions, hashtags, URLs. Present when fetched fresh. */
  entities?: XPostEntities;
}

export interface XPropertiesLike {
  url?: string;
  xPostId?: string;
  xText?: string;
  xAuthorUsername?: string;
  xAuthorName?: string;
  xAuthorProfileImageUrl?: string;
  xPostedAt?: string;
  xLikeCount?: number;
  xRetweetCount?: number;
  xReplyCount?: number;
  xEntities?: XPostEntities;
}

export const X_METADATA_POST_ID_KEY = 'xPostId' as const;

export function hasXMetadata(
  properties: XPropertiesLike | null | undefined
): boolean {
  if (!properties || typeof properties !== 'object') return false;
  const value = (properties as Record<string, unknown>)[X_METADATA_POST_ID_KEY];
  return typeof value === 'string' && value.length > 0;
}

export interface UseXBlockDeps {
  onUrlSubmit: (url: string) => Promise<void>;
}

export interface XBlockHookProps {
  url: string;
  properties: XPropertiesLike;
  isActive: boolean;
  instanceId: string;
  canPersist: boolean;
}

export interface UseXBlockReturn {
  url: string;
  metadata: XMetadata | null;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
}

export type XViewProps = UseXBlockReturn & { isActive: boolean };
