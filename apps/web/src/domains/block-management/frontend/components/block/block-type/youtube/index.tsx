'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { cn } from '@workspace/ui/lib/utils';
import { Youtube, Play } from 'lucide-react';
import { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import {
  ColorToken,
  getSelectedRingClasses,
  getGlowColor,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { fetchYouTubeMetadata } from '@/domains/block-management/actions/youtube.actions';

/**
 * YouTube Block Component
 *
 * YouTube 영상 임베드 블록 컴포넌트 - YouTube 메타데이터를 자동으로 가져와 카드 형태로 표시
 */
export const YoutubeBlock = memo(function YoutubeBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as YoutubeBlockNodeData;
  const properties = nodeData.properties as YoutubeBlockProperties;

  // Properties destructuring
  const {
    url,
    youtubeTitle,
    youtubeDescription,
    youtubeThumbnail,
    viewCount,
    channelName,
    channelThumbnail,
    subscriberCount,
    commentCount,
    likeCount,
    publishedAt,
  } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 400;
  const height = typeof nodeH === 'number' ? nodeH : 225;

  // State
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  // Optimistic state for metadata
  const [optimisticMetadata, setOptimisticMetadata] = useState<{
    youtubeTitle?: string;
    youtubeThumbnail?: string;
    channelName?: string;
    channelThumbnail?: string;
    viewCount?: number;
    likeCount?: number;
    subscriberCount?: number;
    commentCount?: number;
    publishedAt?: string;
  } | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string>(url);

  // Hooks
  const { updateProperty, updateProperties } = useBlockPropertyUpdate();

  // Color for styling (기본값)
  const color = ColorToken.GRAY;

  // URL이 변경되면 optimistic metadata 초기화
  React.useEffect(() => {
    if (url && url !== prevUrlRef.current) {
      setOptimisticMetadata(null); // 새 URL이면 optimistic state 초기화
      setIsLoading(true);
      setHasError(false);
      setShowPlayer(false); // URL 변경 시 플레이어 닫기
      prevUrlRef.current = url;
    }
  }, [url]);

  // 선택 해제 시 플레이어 닫기
  React.useEffect(() => {
    if (!selected) {
      setShowPlayer(false);
    }
  }, [selected]);

  /**
   * YouTube 비디오 ID 추출
   */
  const getVideoId = useCallback((urlString: string): string | null => {
    try {
      const match = urlString.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Optimistic 또는 실제 메타데이터 사용
   */
  const displayMetadata = {
    youtubeTitle: optimisticMetadata?.youtubeTitle ?? youtubeTitle,
    youtubeThumbnail: optimisticMetadata?.youtubeThumbnail ?? youtubeThumbnail,
    channelName: optimisticMetadata?.channelName ?? channelName,
    channelThumbnail: optimisticMetadata?.channelThumbnail ?? channelThumbnail,
    viewCount: optimisticMetadata?.viewCount ?? viewCount,
    likeCount: optimisticMetadata?.likeCount ?? likeCount,
    subscriberCount: optimisticMetadata?.subscriberCount ?? subscriberCount,
    commentCount: optimisticMetadata?.commentCount ?? commentCount,
    publishedAt: optimisticMetadata?.publishedAt ?? publishedAt,
  };

  /**
   * 썸네일 URL 가져오기
   */
  const getThumbnailUrl = useCallback((): string | null => {
    // fetch된 썸네일이 있으면 우선 사용 (optimistic or real)
    if (displayMetadata.youtubeThumbnail) {
      return displayMetadata.youtubeThumbnail;
    }
    // 없으면 비디오 ID로부터 생성
    const videoId = getVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
  }, [url, displayMetadata.youtubeThumbnail, getVideoId]);

  /**
   * Embed URL 생성
   */
  const getEmbedUrl = useCallback((): string | null => {
    const videoId = getVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }, [url, getVideoId]);

  /**
   * 메타데이터 fetch 실행 여부 추적 (중복 방지)
   */
  const isFetchingRef = React.useRef(false);
  const fetchedUrlRef = React.useRef<string | null>(null);

  /**
   * YouTube 메타데이터 fetch (서버 액션 연동)
   */
  const fetchMetadata = useCallback(
    async (urlString: string) => {
      // Block ID 확인
      const blockId = nodeData.blockId;

      if (!urlString) {
        return;
      }

      if (!blockId) {
        return;
      }

      // 중복 호출 방지
      if (isFetchingRef.current || fetchedUrlRef.current === urlString) {
        return;
      }

      isFetchingRef.current = true;
      fetchedUrlRef.current = urlString;
      setIsLoading(true);
      setHasError(false);

      try {
        const result = await fetchYouTubeMetadata(urlString);
        if (result.success) {
          const m = result.data;

          const metadata = {
            youtubeTitle: m.title,
            youtubeDescription: m.description,
            youtubeThumbnail: m.thumbnailUrl,
            channelName: m.channelName,
            channelThumbnail: m.channelThumbnailUrl,
            viewCount: m.viewCount,
            likeCount: m.likeCount,
            subscriberCount: m.subscriberCount,
            commentCount: m.commentCount,
            publishedAt: m.publishedAt,
          };

          // Optimistic update (즉시 UI에 반영)
          setOptimisticMetadata(metadata);

          // 한번에 모든 properties 업데이트
          // 중요: React Flow node ID (id)를 전달해야 optimistic update가 작동
          await updateProperties(id, metadata, nodeData);
        } else {
          setHasError(true);
        }
      } catch (error) {
        setHasError(true);
        setOptimisticMetadata(null); // 실패 시 optimistic state 초기화
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [id, updateProperties, nodeData]
  );

  /**
   * URL 변경 시 메타데이터 자동 fetch
   */
  useEffect(() => {
    if (url) {
      const hasNoMetadata = !youtubeTitle && !optimisticMetadata;

      // URL이 있고 메타데이터가 없으면 fetch
      if (hasNoMetadata) {
        // URL이 변경되었는지 확인
        if (fetchedUrlRef.current !== url) {
          fetchMetadata(url);
        }
      } else {
        setIsLoading(false); // 메타데이터가 있으면 로딩 종료
      }
    }
  }, [url, youtubeTitle, optimisticMetadata, fetchMetadata, nodeData]);

  /**
   * 선택되었을 때 input에 자동 포커스
   */
  useEffect(() => {
    if (selected && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, url]);

  /**
   * 썸네일 클릭으로 플레이어 표시 (selected 상태에서만)
   */
  const handleThumbnailClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selected && url) {
        setIsIframeLoading(true);
        setShowPlayer(true);
      }
    },
    [selected, url]
  );

  /**
   * iframe 로드 완료 핸들러
   */
  const handleIframeLoad = useCallback(() => {
    setIsIframeLoading(false);
  }, []);

  /**
   * URL 입력 제출 핸들러
   */
  const handleUrlSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const trimmedUrl = draftUrl.trim();
      if (!trimmedUrl) return;

      try {
        // Optimistic update: 즉시 로컬 상태 업데이트
        await updateProperty(id, 'properties.url', trimmedUrl, nodeData);
        setDraftUrl('');
      } catch (error) {
        console.error('Failed to save URL:', error);
      }
    },
    [draftUrl, id, updateProperty, nodeData]
  );

  /**
   * URL 입력 변경 핸들러
   */
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftUrl(e.target.value);
    },
    []
  );

  /**
   * URL 입력 키 다운 핸들러
   */
  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();

      if (e.key === 'Enter') {
        handleUrlSubmit();
      } else if (e.key === 'Escape') {
        setDraftUrl('');
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
    },
    [handleUrlSubmit]
  );

  /**
   * URL 입력 폼 렌더링 (URL이 없을 때)
   */
  const renderEmptyState = () => (
    <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-center p-4 rounded-lg',
        'bg-background border-2 border-border',
        'shadow-md',
        // 호버 효과 (선택되지 않았을 때만)
        !selected && 'hover:shadow-xl',
        // 선택 효과
        selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
        selected && 'shadow-xl',
        // Transition
        'transition-all duration-300 ease-out'
      )}
    >
      <Youtube className="h-12 w-12 shrink-0 text-red-500 mb-4" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
        Enter YouTube URL
      </p>
      <form
        onSubmit={handleUrlSubmit}
        className="w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="url"
          value={draftUrl}
          onChange={handleUrlChange}
          onKeyDown={handleUrlKeyDown}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 text-sm rounded-md nodrag border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          onClick={e => e.stopPropagation()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Press Enter to save
        </p>
      </form>
    </div>
  );

  /**
   * 로딩 상태 렌더링
   */
  const renderLoading = () => (
    <div
      className={cn(
        'w-full h-full flex flex-col gap-2 p-4 rounded-lg',
        'bg-background border-2 border-border',
        'shadow-md',
        // 호버 효과 (선택되지 않았을 때만)
        !selected && 'hover:shadow-xl',
        // 선택 효과
        selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
        selected && 'shadow-xl',
        // Transition
        'transition-all duration-300 ease-out'
      )}
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );

  /**
   * YouTube 영상 프리뷰 카드 렌더링
   */
  const renderPreviewCard = () => {
    const thumbnailUrl = getThumbnailUrl();
    const embedUrl = getEmbedUrl();

    if (!embedUrl) {
      return (
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center p-4 rounded-lg',
            'bg-background border-2 border-red-500',
            'shadow-md'
          )}
        >
          <Youtube className="h-12 w-12 text-red-500 mb-2" />
          <p className="text-sm text-red-500">Invalid YouTube URL</p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'w-full h-full flex flex-col overflow-hidden rounded-lg',
          'bg-background border-2 border-border',
          'shadow-md',
          !selected && 'hover:shadow-xl',
          selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
          selected && 'shadow-xl',
          'transition-all duration-300 ease-out',
          'group'
        )}
      >
        {/* 썸네일 영역 */}
        <div className="flex-1 relative min-h-0">
          {/* 썸네일 */}
          <div
            className={cn(
              'absolute inset-0 bg-black',
              selected && !showPlayer && 'cursor-pointer',
              showPlayer && 'pointer-events-none'
            )}
            onClick={selected && !showPlayer ? handleThumbnailClick : undefined}
          >
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={youtubeTitle || 'YouTube thumbnail'}
                className="w-full h-full object-cover"
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={e => {
                  setIsLoading(false);
                  setHasError(true);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {/* 로딩 상태 */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Play 버튼 오버레이 */}
            {!isLoading && !hasError && !showPlayer && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full bg-red-600 flex items-center justify-center transition-transform',
                    selected && 'group-hover:scale-110'
                  )}
                >
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>

          {/* iframe 플레이어 오버레이 (absolute) */}
          {showPlayer && selected && (
            <div
              className={cn(
                'absolute inset-0 bg-black z-10 flex items-center justify-center',
                'transition-opacity duration-300',
                isIframeLoading ? 'opacity-0' : 'opacity-100'
              )}
            >
              {/* iframe 로딩 스켈레톤 */}
              {isIframeLoading && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-sm text-white/80">Loading video...</p>
                  </div>
                </div>
              )}

              {/* iframe */}
              <iframe
                src={embedUrl || ''}
                title={displayMetadata.youtubeTitle || 'YouTube video player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </div>

        {/* 하단 메타 정보 (YouTube 썸네일 UX) */}
        <div className="p-3 flex items-start gap-3 bg-background border-t border-border">
          {/* 채널 아바타 */}
          {displayMetadata.channelThumbnail ? (
            <img
              src={displayMetadata.channelThumbnail}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
              {displayMetadata.youtubeTitle || 'YouTube Video'}
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {displayMetadata.channelName && (
                <span className="truncate max-w-[50%]">
                  {displayMetadata.channelName}
                </span>
              )}
              {displayMetadata.channelName &&
                (displayMetadata.viewCount || displayMetadata.publishedAt) && (
                  <span>•</span>
                )}
              {displayMetadata.viewCount && (
                <span>{displayMetadata.viewCount.toLocaleString()} views</span>
              )}
              {displayMetadata.viewCount && displayMetadata.publishedAt && (
                <span>•</span>
              )}
              {displayMetadata.publishedAt && (
                <span>{formatRelativeTime(displayMetadata.publishedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 상대적 시간 포맷팅
   *
   * @param dateIso - ISO 8601 형식의 날짜 문자열
   * @returns 상대적 시간 문자열 (예: "2개월 전", "5일 전")
   */
  function formatRelativeTime(dateIso?: string): string {
    if (!dateIso) return '';

    const now = new Date();
    const then = new Date(dateIso);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    // 가장 적절한 단위 선택
    if (diffYear > 0) {
      return rtf.format(-diffYear, 'year');
    } else if (diffMonth > 0) {
      return rtf.format(-diffMonth, 'month');
    } else if (diffDay > 0) {
      return rtf.format(-diffDay, 'day');
    } else if (diffHour > 0) {
      return rtf.format(-diffHour, 'hour');
    } else if (diffMin > 0) {
      return rtf.format(-diffMin, 'minute');
    } else {
      return rtf.format(-diffSec, 'second');
    }
  }

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <TooltipProvider>
        <div
          className={cn(
            'w-full h-full flex flex-col',
            // 레이아웃 변화(width/height)에는 transition을 적용하지 않고
            // 시각 효과에만 transition 적용하여 리사이즈 시 렌더링 지연 방지
            'transition-[box-shadow,transform] duration-300 ease-out'
          )}
        >
          {!url && renderEmptyState()}
          {url && isLoading && renderLoading()}
          {url && !isLoading && renderPreviewCard()}
        </div>
      </TooltipProvider>
    </BaseBlock>
  );
});
