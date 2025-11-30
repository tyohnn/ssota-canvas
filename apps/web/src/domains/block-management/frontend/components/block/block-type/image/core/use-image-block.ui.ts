/**
 * ImageBlock UI State Hook
 *
 * UI 상태만 관리 (비즈니스 로직 없음)
 * 노코드 환경에서 독립적으로 테스트 가능
 */

import { useState, useCallback, useRef } from 'react';
import type { ImageBlockUIState } from './types';

export function useImageBlockUI(
  initialImageUrl: string | undefined,
  initialCaption: string | undefined
): ImageBlockUIState {
  // Display state
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(
    initialImageUrl
  );

  // Caption editing state
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [draftCaption, setDraftCaption] = useState(initialCaption || '');

  // Refs
  const originalCaptionRef = useRef(initialCaption || '');
  const retryCountRef = useRef(0);
  const prevImageUrlRef = useRef(initialImageUrl);
  const prevImageAssetIdRef = useRef<string | undefined>(undefined);
  const isLoadingUrlRef = useRef(false); // 로딩 중 플래그

  // Caption handlers
  const handleCaptionClick = useCallback(() => {
    setIsEditingCaption(true);
    // originalCaptionRef는 외부에서 설정됨
  }, []);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        // Escape: 원본 값으로 복원
        setDraftCaption(originalCaptionRef.current);
        setIsEditingCaption(false);
      }
    },
    []
  );

  return {
    // State
    isHovered,
    isLoading,
    hasError,
    isRefreshing,
    displayUrl,
    isEditingCaption,
    draftCaption,

    // Setters
    setIsHovered,
    setIsLoading,
    setHasError,
    setIsRefreshing,
    setDisplayUrl,
    setIsEditingCaption,
    setDraftCaption,

    // Handlers
    handleCaptionClick,
    handleCaptionKeyDown,

    // Refs
    originalCaptionRef,
    retryCountRef,
    prevImageUrlRef,
    prevImageAssetIdRef,
    isLoadingUrlRef,
  };
}

