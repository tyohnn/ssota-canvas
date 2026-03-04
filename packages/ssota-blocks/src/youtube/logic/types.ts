import type React from 'react';

/**
 * YouTube Block Types (minimal, package-agnostic)
 */

/**
 * YouTube Metadata (minimal interface for View components)
 * Compatible with YoutubeBlockProperties but does not depend on block-management
 */
export interface YoutubeMetadata {
  url?: string;
  youtubeId?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubeThumbnail?: string;
  channelThumbnail?: string;
  channelName?: string;
  youtubeChannelId?: string;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  subscriberCount?: number;
  publishedAt?: string;
}

/**
 * YouTube Player 인스턴스 타입 (react-youtube의 onReady 이벤트에서 반환)
 */
export type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getDuration: () => number;
};

/** Properties shape for callbacks (url or full metadata) */
export type YoutubePropertiesLike = object & { url?: string };

/** Key to check if YouTube metadata has been fetched (youtubeTitle) */
export const YOUTUBE_METADATA_TITLE_KEY = 'youtubeTitle' as const;

/** Safely check if properties has YouTube metadata (type-safe access) */
export function hasYoutubeMetadata(
  properties: YoutubePropertiesLike | null | undefined
): boolean {
  if (!properties || typeof properties !== 'object') return false;
  const value = (properties as Record<string, unknown>)[YOUTUBE_METADATA_TITLE_KEY];
  return typeof value === 'string' && value.length > 0;
}

/** UseYoutubeBlock deps - all domain/framework deps injected by caller */
export interface UseYoutubeBlockDeps {
  /** Process URL: fetch metadata, update properties, etc. Caller handles all persistence. */
  onUrlSubmit: (url: string) => Promise<void>;
  /** Extract thumbnail URL from properties */
  getThumbnailUrl: (properties: YoutubePropertiesLike) => string | null;
  /** Extract video ID from properties (properties.url or properties) */
  getVideoId: (properties: YoutubePropertiesLike) => string | undefined;
  /** Extract embed URL from properties */
  getEmbedUrl: (properties: YoutubePropertiesLike) => string;
  onProvideCallbacks?: (provide: () => Promise<Record<string, (...args: unknown[]) => void>>) => void;
  onUnmount?: () => void;
}

export interface YoutubeBlockHookProps {
  url: string;
  properties: YoutubePropertiesLike;
  showPlayer: boolean;
  isActive: boolean;
  instanceId: string;
}

export interface YoutubeBlockUIState {
  showPlayer: boolean;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  isIframeLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleIframeLoad: () => void;
  handlePlayerReady: (event: { target: YouTubePlayer }) => void;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleImageLoad: () => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export interface YoutubeBlockBusinessLogic {
  getVideoId: (urlString: string) => string | null;
  getThumbnailUrl: () => string | null;
  getEmbedUrl: () => string | null;
  fetchMetadata: (urlString: string) => Promise<{
    success: boolean;
    metadata?: YoutubeMetadata;
    blockUuid?: string;
    error?: string;
  }>;
}

export interface UseYoutubeBlockReturn {
  showPlayer: boolean;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  isIframeLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  getVideoId: (urlString: string) => string | null;
  getThumbnailUrl: () => string | null;
  getEmbedUrl: () => string | null;
  handleIframeLoad: () => void;
  handlePlayerReady: (event: { target: YouTubePlayer }) => void;
  handleUrlSubmit: (e?: React.FormEvent | { preventDefault(): void } | undefined) => Promise<void>;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleImageLoad: () => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  url: string;
  properties: YoutubePropertiesLike;
}
