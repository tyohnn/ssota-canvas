/**
 * ImageBlock Types
 *
 * UI 상태와 비즈니스 로직의 인터페이스 정의
 */

import type { RefObject } from 'react';
import type { ImageBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';

/**
 * ImageBlock UI State
 *
 * UI 상태만 관리 (비즈니스 로직 없음)
 */
export interface ImageBlockUIState {
  // Display state
  isHovered: boolean;
  isLoading: boolean;
  hasError: boolean;
  isRefreshing: boolean;
  displayUrl: string | undefined;

  // Caption editing state
  isEditingCaption: boolean;
  draftCaption: string;

  // Setters
  setIsHovered: (hovered: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setHasError: (error: boolean) => void;
  setIsRefreshing: (refreshing: boolean) => void;
  setDisplayUrl: (url: string | undefined) => void;
  setIsEditingCaption: (editing: boolean) => void;
  setDraftCaption: (caption: string) => void;

  // Caption handlers
  handleCaptionClick: () => void;
  handleCaptionKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Refs
  originalCaptionRef: RefObject<string>;
  retryCountRef: RefObject<number>;
  prevImageUrlRef: RefObject<string | undefined>;
  prevImageAssetIdRef: RefObject<string | undefined>;
  isLoadingUrlRef: RefObject<boolean>;
}

/**
 * ImageBlock Business Logic
 *
 * 비즈니스 로직만 관리 (API 호출, 파일 업로드 등)
 */
export interface ImageBlockBusinessLogic {
  // Image loading
  loadImageUrl: (
    imageAssetId: string | undefined,
    imageUrl: string | undefined,
    imageSource: string | undefined
  ) => Promise<void>;

  // Image handlers
  handleImageLoad: () => void;
  handleImageError: () => Promise<void>;

  // Caption save
  saveCaptionToServer: (caption: string) => Promise<void>;

  // File upload
  handleFileUpload: (files: FileWithPreview[]) => Promise<void>;

  // Upload state
  isUploading: boolean;
}

/**
 * ImageBlock Combined Props
 */
export interface ImageBlockProps {
  // Node data
  nodeData: ImageBlockNodeData;
  properties: ImageBlockProperties;

  // Dimensions
  width: number;
  height: number;

  // Selection state
  selected: boolean;

  // Optional business logic injection (for testing/mock)
  businessLogic?: ImageBlockBusinessLogic;
}

/**
 * ImageBlock Configuration
 */
export interface ImageBlockConfig {
  maxSizeMB: number;
  maxSize: number;
}

