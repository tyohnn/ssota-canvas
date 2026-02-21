import type { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

/**
 * YouTube Metadata 타입
 * YoutubeBlockProperties에서 url과 youtubeId를 제외한 메타데이터 부분
 */
export type YoutubeMetadata = Omit<YoutubeBlockProperties, 'url' | 'youtubeId'>;

/**
 * Display Metadata 타입
 * properties를 그대로 사용하므로 YoutubeBlockProperties의 메타데이터 부분과 동일
 */
export type DisplayMetadata = YoutubeMetadata;

/**
 * YouTube Block Hook Props
 */
export interface YoutubeBlockHookProps {
  nodeData: YoutubeBlockNodeData;
  selected: boolean;
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
  getPlayerState: () => number; // YT.PlayerState enum 값
  getDuration: () => number;
  // 기타 YouTube IFrame Player API 메서드들
};

/**
 * YouTube Block UI State
 */
export interface YoutubeBlockUIState {
  showPlayer: boolean;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  isIframeLoading: boolean;
  isDragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  prevUrlRef: React.RefObject<string>;
  playerRef: { current: YouTubePlayer | null };
  setIsLoading: (loading: boolean) => void;
  setHasError: (error: boolean) => void;
  setDraftUrl: (url: string) => void;
  setIsIframeLoading: (loading: boolean) => void;
  handleIframeLoad: () => void;
  handlePlayerReady: (event: { target: YouTubePlayer }) => void;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleImageLoad: () => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * YouTube Block Business Logic
 */
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

/**
 * YouTube Block Hook Return Type
 */
export interface UseYoutubeBlockReturn {
  // UI State
  showPlayer: boolean;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  isIframeLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;

  // Business Logic
  getVideoId: (urlString: string) => string | null;
  getThumbnailUrl: () => string | null;
  getEmbedUrl: () => string | null;

  // Handlers
  handleIframeLoad: () => void;
  handlePlayerReady: (event: { target: YouTubePlayer }) => void;
  handleUrlSubmit: (e: React.FormEvent) => Promise<void>;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleImageLoad: () => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;

  // Properties
  url: string;
  properties: YoutubeBlockProperties;
}
