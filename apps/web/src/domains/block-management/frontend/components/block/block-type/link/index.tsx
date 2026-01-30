'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { NodeProps } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { fetchOpenGraphMetadata } from '@/domains/block-management/actions/opengraph.actions';
import type { OpenGraphMetadata } from '@/domains/block-management/actions/opengraph.actions';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { LinkBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  ColorToken,
  getGlowColor,
  getSelectedRingClasses,
} from '@/domains/block-management/shared/types/style-tokens.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { BaseBlock } from '../../base-block';

/**
 * Link Block Component
 *
 * URL 프리뷰 블록 컴포넌트 - 오픈그래프 메타데이터를 자동으로 가져와 카드 형태로 표시
 */
export const LinkBlock = memo(function LinkBlock({
  id,
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as LinkBlockNodeData;
  const properties = nodeData.properties as LinkBlockProperties;

  // Properties destructuring
  const {
    url,
    ogTitle,
    ogDescription,
    ogImage,
    siteName,
    domain,
    faviconUrl,
    author,
    publishedAt,
    pageType,
  } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 300;
  const height = typeof nodeH === 'number' ? nodeH : 150;

  // State for Open Graph metadata
  // properties에 저장된 메타데이터를 초기값으로 사용 (빠른 렌더링)
  const [metadata, setMetadata] = useState<OpenGraphMetadata | null>(() => {
    // properties에 메타데이터가 있으면 사용
    if (ogTitle || ogDescription || ogImage) {
      return {
        title: ogTitle || '',
        description: ogDescription || '',
        imageUrl: ogImage || '',
        siteName: siteName || '',
        domain: domain || '',
        faviconUrl: faviconUrl || '',
        type: pageType || 'website',
        author,
        publishedAt,
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [faviconIndex, setFaviconIndex] = useState(0);
  const [isFaviconExhausted, setIsFaviconExhausted] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string>(url);
  const lastPersistedFaviconRef = useRef<string | null>(null);

  // Hooks
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });

  // Color for styling (기본값)
  const color = ColorToken.GRAY;

  /**
   * URL에서 도메인 추출
   */
  const getDomain = useCallback((urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }, []);

  const normalizedDomain = useMemo(() => {
    const baseDomain = (
      metadata?.domain?.trim() || (url ? getDomain(url) : '')
    ).trim();

    if (!baseDomain) {
      return '';
    }

    return baseDomain
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }, [metadata?.domain, url, getDomain]);

  const sanitizeFaviconUrl = useCallback(
    (favicon?: string | null): string | null => {
      if (!favicon || !favicon.trim()) {
        if (!normalizedDomain) {
          return null;
        }
        return `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`;
      }

      const normalizedFavicon = favicon.trim();
      const lowercaseFavicon = normalizedFavicon.toLowerCase();
      const needsReplacement =
        lowercaseFavicon.includes('google.com/s2/favicons') ||
        lowercaseFavicon.includes('gstatic.com/favicon');

      if (needsReplacement) {
        if (!normalizedDomain) {
          return null;
        }
        return `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`;
      }

      return normalizedFavicon;
    },
    [normalizedDomain]
  );

  const sanitizedMetadataFavicon = useMemo(
    () => sanitizeFaviconUrl(metadata?.faviconUrl),
    [metadata?.faviconUrl, sanitizeFaviconUrl]
  );

  useEffect(() => {
    if (!metadata) {
      return;
    }

    const targetFavicon =
      sanitizedMetadataFavicon ||
      (normalizedDomain
        ? `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`
        : '');

    if (metadata.faviconUrl !== targetFavicon) {
      setMetadata(prev =>
        prev
          ? {
              ...prev,
              faviconUrl: targetFavicon,
            }
          : prev
      );

      if (targetFavicon && lastPersistedFaviconRef.current !== targetFavicon) {
        lastPersistedFaviconRef.current = targetFavicon;
        updateProperties(
          id,
          {
            faviconUrl: targetFavicon,
          },
          nodeData
        ).catch(error => {
          console.error('Failed to persist sanitized favicon URL:', error);
        });
      }
    }
  }, [
    id,
    metadata,
    sanitizedMetadataFavicon,
    normalizedDomain,
    updateProperties,
    nodeData,
  ]);

  const faviconCandidates = useMemo(() => {
    const candidates: string[] = [];

    if (sanitizedMetadataFavicon) {
      candidates.push(sanitizedMetadataFavicon);
    }

    if (normalizedDomain) {
      candidates.push(`https://${normalizedDomain}/favicon.ico`);
      candidates.push(`https://${normalizedDomain}/apple-touch-icon.png`);
      candidates.push(
        `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`
      );
    }

    const absoluteCandidates = candidates
      .filter(candidate => Boolean(candidate))
      .map(candidate => {
        if (!candidate) {
          return '';
        }

        if (/^https?:\/\//i.test(candidate)) {
          return candidate;
        }

        if (!normalizedDomain) {
          return candidate;
        }

        const trimmedCandidate = candidate.replace(/^\/+/, '');
        return `https://${normalizedDomain}/${trimmedCandidate}`;
      })
      .filter((candidate): candidate is string => Boolean(candidate));

    return Array.from(new Set(absoluteCandidates));
  }, [sanitizedMetadataFavicon, normalizedDomain]);

  const currentFaviconUrl =
    !isFaviconExhausted && faviconCandidates.length > 0
      ? faviconCandidates[Math.min(faviconIndex, faviconCandidates.length - 1)]
      : null;

  useEffect(() => {
    setFaviconIndex(0);
    setIsFaviconExhausted(false);
  }, [faviconCandidates]);

  const handleFaviconError = useCallback(() => {
    setFaviconIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < faviconCandidates.length) {
        return nextIndex;
      }

      setIsFaviconExhausted(true);
      return prevIndex;
    });
  }, [faviconCandidates.length]);

  /**
   * 오픈그래프 메타데이터 fetch 및 properties에 저장
   */
  const fetchMetadata = useCallback(
    async (urlString: string) => {
      if (!urlString) {
        setMetadata(null);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const result = await fetchOpenGraphMetadata(urlString);

        if (result.success) {
          setMetadata(result.data);

          // 메타데이터를 properties에 저장 (DB에 저장하여 재렌더링 시 빠르게 표시)
          await updateProperties(
            id,
            {
              ogTitle: result.data.title,
              ogDescription: result.data.description,
              ogImage: result.data.imageUrl,
              siteName: result.data.siteName,
              domain: result.data.domain,
              faviconUrl: result.data.faviconUrl,
              author: result.data.author,
              publishedAt: result.data.publishedAt,
              pageType: result.data.type,
            },
            nodeData
          );
        } else {
          setHasError(true);
          // Fallback 데이터
          const domainValue = getDomain(urlString);
          const fallbackMetadata = {
            title: domainValue || 'Invalid URL',
            description: urlString,
            imageUrl: '',
            siteName: domainValue,
            domain: domainValue,
            faviconUrl: `https://icons.duckduckgo.com/ip3/${domainValue}.ico`,
            type: 'website',
          };
          setMetadata(fallbackMetadata);

          // Fallback 데이터도 properties에 저장
          await updateProperties(
            id,
            {
              ogTitle: fallbackMetadata.title,
              ogDescription: fallbackMetadata.description,
              ogImage: fallbackMetadata.imageUrl,
              siteName: fallbackMetadata.siteName,
              domain: fallbackMetadata.domain,
              faviconUrl: fallbackMetadata.faviconUrl,
              pageType: fallbackMetadata.type,
            },
            nodeData
          );
        }
      } catch (error) {
        console.error('Failed to fetch Open Graph metadata:', error);
        setHasError(true);
        // Fallback 데이터
        const domainValue = getDomain(urlString);
        const fallbackMetadata = {
          title: domainValue || 'Invalid URL',
          description: urlString,
          imageUrl: '',
          siteName: domainValue,
          domain: domainValue,
          faviconUrl: `https://icons.duckduckgo.com/ip3/${domainValue}.ico`,
          type: 'website',
        };
        setMetadata(fallbackMetadata);

        // Fallback 데이터도 properties에 저장
        try {
          await updateProperties(
            id,
            {
              ogTitle: fallbackMetadata.title,
              ogDescription: fallbackMetadata.description,
              ogImage: fallbackMetadata.imageUrl,
              siteName: fallbackMetadata.siteName,
              domain: fallbackMetadata.domain,
              faviconUrl: fallbackMetadata.faviconUrl,
              pageType: fallbackMetadata.type,
            },
            nodeData
          );
        } catch (updateError) {
          console.error('Failed to save fallback metadata:', updateError);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [getDomain, updateProperties, id, nodeData]
  );

  /**
   * properties에서 메타데이터 동기화 (외부 업데이트 반영)
   */
  useEffect(() => {
    if (ogTitle || ogDescription || ogImage) {
      setMetadata({
        title: ogTitle || '',
        description: ogDescription || '',
        imageUrl: ogImage || '',
        siteName: siteName || '',
        domain: domain || '',
        faviconUrl: faviconUrl || '',
        type: pageType || 'website',
        author,
        publishedAt,
      });
    }
  }, [
    ogTitle,
    ogDescription,
    ogImage,
    siteName,
    domain,
    faviconUrl,
    author,
    publishedAt,
    pageType,
  ]);

  /**
   * URL 변경 시 메타데이터 자동 fetch
   * URL이 변경되면 항상 fetch (toolbar에서 URL 변경 시)
   */
  useEffect(() => {
    if (url) {
      // URL이 변경되었거나 메타데이터가 없으면 fetch
      const hasUrlChanged = prevUrlRef.current !== url;
      const hasNoMetadata = !ogTitle && !ogDescription && !ogImage;

      if (hasUrlChanged || hasNoMetadata) {
        fetchMetadata(url);
        prevUrlRef.current = url;
      }
    } else {
      setMetadata(null);
      prevUrlRef.current = '';
    }
  }, [url, fetchMetadata, ogTitle, ogDescription, ogImage]);

  /**
   * 선택되었을 때 input에 자동 포커스
   */
  useEffect(() => {
    if (selected && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, url]);

  /**
   * 더블클릭 핸들러 (링크 열기)
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selected && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [selected, url]
  );

  /**
   * URL 입력 제출 핸들러
   */
  const handleUrlSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!draftUrl.trim()) return;

      try {
        await updateProperty(id, 'properties.url', draftUrl.trim(), nodeData);
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
      <LinkIcon className="h-12 w-12 shrink-0 text-gray-400 dark:text-gray-500 mb-4" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
        URL을 입력해주세요
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
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm rounded-md nodrag border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          onClick={e => e.stopPropagation()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Enter를 눌러 저장하세요
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
   * 링크 프리뷰 카드 렌더링
   */
  const renderPreviewCard = () => {
    if (!metadata) return null;

    return (
      <div
        className={cn(
          'w-full h-full flex flex-col overflow-hidden rounded-lg',
          'bg-background border-2 border-border',
          'shadow-md',
          // 호버 효과 (선택되지 않았을 때만)
          !selected && 'hover:shadow-xl',
          // 선택 효과
          selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
          selected && 'shadow-xl',
          // Transition
          'transition-all duration-300 ease-out',
          // 선택되었을 때만 더블클릭 가능 표시
          selected && 'cursor-pointer'
        )}
        onDoubleClick={handleDoubleClick}
      >
        {/* 썸네일 이미지 (있는 경우) - SNS 링크 카드 스타일 */}
        {metadata.imageUrl && (
          <div className="w-full aspect-2/1 bg-gray-100 dark:bg-gray-700 shrink-0 overflow-hidden relative">
            <img
              src={metadata.imageUrl}
              alt={metadata.title}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* 제목 & 설명 */}
        <div className="flex-1 p-3 pb-2 flex flex-col gap-1.5 min-h-0 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
            {metadata.title}
          </h3>

          {metadata.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {metadata.description}
            </p>
          )}

          {/* Article 메타데이터 (작성자 & 게시일) */}
          {metadata.type === 'article' &&
            (metadata.author || metadata.publishedAt) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metadata.author && (
                  <span className="truncate">{metadata.author}</span>
                )}
                {metadata.author && metadata.publishedAt && <span>•</span>}
                {metadata.publishedAt && (
                  <span>
                    {new Date(metadata.publishedAt).toLocaleDateString(
                      'ko-KR',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                )}
              </div>
            )}
        </div>

        {/* 도메인 & 파비콘 */}
        <div className="p-3 pt-0 mt-auto">
          <div className="flex items-center gap-1.5">
            {currentFaviconUrl && !isFaviconExhausted && (
              <img
                src={currentFaviconUrl}
                alt=""
                className="w-4 h-4 shrink-0"
                onError={handleFaviconError}
              />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {metadata.domain || normalizedDomain}
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500 ml-auto shrink-0" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
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
