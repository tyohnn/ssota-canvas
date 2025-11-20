import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/**
 * Image Space Types
 */

export type TopMenu = 'explore' | 'editor' | 'community';
export type ExploreTab = 'unsplash' | 'ssota' | 'ai-prompt' | 'workspace';
export type CommunityTab = 'ranking' | 'trending';
export type ImageSource = 'unsplash' | 'ssota' | 'ai' | 'workspace';

/**
 * Image Space Props (외부 노출)
 */
export interface ImageSpaceProps {
  blockId: string;
  blockData: BlockNodeData;
}

/**
 * 이미지 선택 파라미터
 */
export interface SelectImageParams {
  imageUrl: string;
  source: ImageSource;
  metadata?: {
    // Image Asset
    imageAssetId?: string;
    // Unsplash
    unsplashAuthorName?: string;
    unsplashAuthorLink?: string;
    // AI
    aiPrompt?: string;
    aiModel?: string;
    // 공통
    alt?: string;
    caption?: string;
  };
}

/**
 * 카테고리 정의
 */
export interface Category {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * 이미지 아이템 (공통)
 */
export interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  source: ImageSource;
  metadata?: Record<string, unknown>;
}
