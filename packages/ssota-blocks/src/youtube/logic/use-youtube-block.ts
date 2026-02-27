'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  hasYoutubeMetadata,
  type UseYoutubeBlockDeps,
  type UseYoutubeBlockReturn,
  type YoutubeBlockHookProps,
} from './types';
import { useYoutubeBlockUI } from './use-youtube-block.ui';

/**
 * YouTube Block Main Hook
 *
 * UI 훅과 비즈니스 로직을 오케스트레이션. 모든 도메인/프레임워크 의존성은 deps로 주입.
 * showPlayer는 Result Injection (호출부 계산).
 * URL 처리(메타데이터 fetch, properties 업데이트)는 onUrlSubmit 콜백으로 위임.
 */
export function useYoutubeBlock(
  props: YoutubeBlockHookProps,
  deps: UseYoutubeBlockDeps
): UseYoutubeBlockReturn {
  const { url, properties, showPlayer, isActive, instanceId } = props;

  const uiState = useYoutubeBlockUI({
    url,
    isActive,
    showPlayer,
    instanceId,
    onProvideCallbacks: deps.onProvideCallbacks,
    onUnmount: deps.onUnmount,
  });

  const getThumbnailUrl = useCallback(
    () => deps.getThumbnailUrl(properties),
    [deps, properties]
  );
  const getEmbedUrl = useCallback(() => {
    const embedUrl = deps.getEmbedUrl(properties);
    if (!embedUrl || !embedUrl.trim()) return null;
    return embedUrl.startsWith('https://www.youtube.com/embed/') ? embedUrl : null;
  }, [deps, properties]);

  const { setIsLoading, setHasError } = uiState as typeof uiState & {
    setIsLoading: (v: boolean) => void;
    setHasError: (v: boolean) => void;
    setDraftUrl: (v: string) => void;
  };

  const isFetchingRef = useRef(false);
  const fetchedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (url) {
      const urlChanged = fetchedUrlRef.current !== url;
      const hasNoMetadata = !hasYoutubeMetadata(properties);
      const isInitialMount = fetchedUrlRef.current === null;

      const shouldFetch =
        urlChanged &&
        !isFetchingRef.current &&
        (isInitialMount ? hasNoMetadata : true);

      if (urlChanged) {
        fetchedUrlRef.current = url;
      }

      if (shouldFetch) {
        isFetchingRef.current = true;

        const processUrlAsync = async () => {
          try {
            setIsLoading(true);
            setHasError(false);
            await deps.onUrlSubmit(url);
            setIsLoading(false);
          } catch {
            setHasError(true);
            setIsLoading(false);
          } finally {
            isFetchingRef.current = false;
          }
        };

        void processUrlAsync();
      } else if (!urlChanged && !hasNoMetadata && !isFetchingRef.current) {
        setIsLoading(false);
      }
    } else {
      isFetchingRef.current = false;
      fetchedUrlRef.current = null;
      setIsLoading(false);
    }
  }, [url, hasYoutubeMetadata(properties), deps.onUrlSubmit, setIsLoading, setHasError]);

  const handleUrlSubmit = useCallback(
    async (e?: React.FormEvent | { preventDefault(): void }) => {
      e?.preventDefault();
      if (e && 'stopPropagation' in e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }

      const trimmedUrl = String((uiState.draftUrl ?? '').trim());
      if (!trimmedUrl) return;

      if (isFetchingRef.current) return;

      const ui = uiState as typeof uiState & {
        setIsLoading: (v: boolean) => void;
        setHasError: (v: boolean) => void;
        setDraftUrl: (v: string) => void;
      };

      isFetchingRef.current = true;
      ui.setIsLoading(true);
      ui.setHasError(false);
      ui.setDraftUrl('');

      try {
        await deps.onUrlSubmit(trimmedUrl);
        ui.setIsLoading(false);
      } catch {
        ui.setHasError(true);
        ui.setIsLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [uiState, deps.onUrlSubmit]
  );

  const getVideoIdForUrl = useCallback(
    (urlOrProperties: string | Record<string, unknown>) => {
      const props =
        typeof urlOrProperties === 'string'
          ? { url: urlOrProperties }
          : urlOrProperties;
      return deps.getVideoId(props as Parameters<typeof deps.getVideoId>[0]) ?? null;
    },
    [deps.getVideoId]
  );

  return {
    showPlayer: uiState.showPlayer,
    isLoading: uiState.isLoading,
    hasError: uiState.hasError,
    draftUrl: uiState.draftUrl,
    isIframeLoading: uiState.isIframeLoading,
    inputRef: uiState.inputRef,
    getVideoId: getVideoIdForUrl,
    getThumbnailUrl,
    getEmbedUrl,
    handleIframeLoad: uiState.handleIframeLoad,
    handlePlayerReady: uiState.handlePlayerReady,
    handleUrlSubmit,
    handleUrlChange: uiState.handleUrlChange,
    handleUrlKeyDown: uiState.handleUrlKeyDown,
    handleImageLoad: uiState.handleImageLoad,
    handleImageError: uiState.handleImageError,
    url,
    properties,
  };
}
