'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import type {
  UseYoutubeBlockReturn,
  YoutubeBlockBusinessLogic,
  YoutubeBlockHookProps,
} from './types';
import { useYoutubeBlockBusiness } from './use-youtube-block.business';
import { useYoutubeBlockUI } from './use-youtube-block.ui';

/**
 * YouTube Block Main Hook
 *
 * UI 훅과 비즈니스 훅을 오케스트레이션하여 통합 로직을 제공합니다.
 * 외부 훅(useReactFlow, useUpdateBlockProperty)은 메인 훅에서만 사용
 */
export function useYoutubeBlock(
  props: YoutubeBlockHookProps,
  businessLogicOverride?: YoutubeBlockBusinessLogic
): UseYoutubeBlockReturn {
  const { nodeData, selected } = props;
  const properties = nodeData.properties;

  // 외부 훅은 메인 훅에서만 사용
  const { getNode, updateNode } = useReactFlow();
  const { updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });
  const canvasMode = useCanvasModeContext();

  // Value Object 인스턴스 생성 (메모이제이션)
  const vo = useMemo(
    () => YoutubeBlockPropertiesVO.fromJSON(properties),
    [properties]
  );

  // UI Hook (순수 UI 상태만, canvasMode는 의존성 주입)
  const uiState = useYoutubeBlockUI(
    vo.url,
    selected,
    nodeData.blockMountId,
    canvasMode
  );

  // Business Hook (또는 주입된 로직)
  const defaultBusiness = useYoutubeBlockBusiness(
    nodeData,
    vo,
    updateProperties
  );
  const business = businessLogicOverride ?? defaultBusiness;

  // Extract fetchMetadata for stable reference in useEffect
  const { fetchMetadata } = business;

  // Extract setter functions for stable reference (useState setters are stable)
  const { setIsLoading, setHasError } = uiState;

  // Fetch 진행 여부 추적 (무한 루프 방지)
  const isFetchingRef = useRef(false);
  const fetchedUrlRef = useRef<string | null>(null);

  // URL 변경 시 메타데이터 자동 fetch (오케스트레이션)
  // 주의: handleUrlSubmit에서 이미 fetchMetadata를 호출하므로,
  // 여기서는 toolbar 등에서 URL이 변경된 경우만 처리
  useEffect(() => {
    if (vo.url) {
      const urlChanged = fetchedUrlRef.current !== vo.url;
      const hasNoMetadata = !vo.youtubeTitle;
      const isInitialMount = fetchedUrlRef.current === null;

      // 초기 마운트: 메타데이터가 없을 때만 fetch (이미 메타데이터가 있으면 불필요한 API 호출 방지)
      // URL 변경: 메타데이터가 있어도 fetch (상단 툴바 등에서 URL을 변경한 경우 업데이트 필요)
      // 이미 같은 URL을 fetch 중이면 스킵
      const shouldFetch =
        urlChanged &&
        !isFetchingRef.current &&
        (isInitialMount ? hasNoMetadata : true); // 초기 마운트는 메타데이터 없을 때만, URL 변경은 항상

      // URL 추적: fetch 여부와 관계없이 현재 URL을 추적하여 다음 변경을 감지할 수 있도록 함
      // 초기 마운트에서 메타데이터가 있어도 URL은 추적해야 함
      if (urlChanged) {
        fetchedUrlRef.current = vo.url;
      }

      if (shouldFetch) {
        isFetchingRef.current = true;

        const fetchMetadataAsync = async () => {
          try {
            setIsLoading(true);
            setHasError(false);

            const result = await fetchMetadata(vo.url);

            if (result.success) {
              // 비즈니스 훅에서 이미 updateProperties 호출됨 (URL + 메타데이터)
              setIsLoading(false);
            } else {
              setHasError(true);
              setIsLoading(false);
            }
          } catch (error) {
            setHasError(true);
            setIsLoading(false);
          } finally {
            isFetchingRef.current = false;
          }
        };

        fetchMetadataAsync();
      } else if (!urlChanged && !hasNoMetadata && !isFetchingRef.current) {
        // URL이 변경되지 않았고 메타데이터가 있고 fetch 중이 아니면 로딩 종료
        setIsLoading(false);
      }
      // urlChanged가 true이고 이미 fetch 중이면 loading 상태 유지
    } else {
      // URL이 없으면 ref 초기화 및 loading 종료
      isFetchingRef.current = false;
      fetchedUrlRef.current = null;
      setIsLoading(false);
    }
  }, [vo.url, vo.youtubeTitle, fetchMetadata, setIsLoading, setHasError]);

  // URL 제출 핸들러
  const handleUrlSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // draftUrl은 항상 string으로 초기화되지만, 안전을 위해 체크
      const trimmedUrl = (uiState.draftUrl || '').trim();
      if (!trimmedUrl) {
        return;
      }

      if (!nodeData?.blockId) {
        throw new Error('Block ID is missing in nodeData');
      }

      // URL 제출 시 즉시 loading 상태 설정 (optimistic)
      uiState.setIsLoading(true);
      uiState.setHasError(false);
      uiState.setDraftUrl('');

      try {
        // 1단계: URL만 먼저 업데이트 (LoadingState 표시를 위해)
        await updateProperties(nodeData.blockId, { url: trimmedUrl }, nodeData);

        // 2단계: 메타데이터 fetch 및 업데이트
        const result = await fetchMetadata(trimmedUrl);

        if (result.success) {
          // 비즈니스 훅에서 이미 updateProperties 호출됨 (URL + 메타데이터)
          uiState.setIsLoading(false);
        } else {
          uiState.setHasError(true);
          uiState.setIsLoading(false);
        }
      } catch (error) {
        uiState.setHasError(true);
        uiState.setIsLoading(false);
      }
    },
    [uiState, fetchMetadata, nodeData, updateProperties]
  );

  return {
    // UI State
    showPlayer: uiState.showPlayer,
    isLoading: uiState.isLoading,
    hasError: uiState.hasError,
    draftUrl: uiState.draftUrl,
    isIframeLoading: uiState.isIframeLoading,
    inputRef: uiState.inputRef,

    // Business Logic
    getVideoId: business.getVideoId,
    getThumbnailUrl: business.getThumbnailUrl,
    getEmbedUrl: business.getEmbedUrl,

    // Handlers
    handleIframeLoad: uiState.handleIframeLoad,
    handlePlayerReady: uiState.handlePlayerReady,
    handleUrlSubmit,
    handleUrlChange: uiState.handleUrlChange,
    handleUrlKeyDown: uiState.handleUrlKeyDown,
    handleImageLoad: uiState.handleImageLoad,
    handleImageError: uiState.handleImageError,

    // Properties
    url: vo.url,
    properties,
  };
}
