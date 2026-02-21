'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import { fetchLinkMetadataAction } from '@/domains/link-app-space/actions/metadata/fetch-link-metadata.action';
import type { OpenGraphMetadata } from '@/domains/link-app-space/shared/types/open-graph-metadata';
import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/hooks';

import type { LinkBlockHookProps, UseLinkBlockReturn } from './types';

function buildFallbackMetadata(
  domainValue: string,
  urlString: string
): OpenGraphMetadata {
  return {
    title: domainValue || 'Invalid URL',
    description: urlString,
    imageUrl: '',
    siteName: domainValue,
    domain: domainValue,
    faviconUrl: `https://icons.duckduckgo.com/ip3/${domainValue}.ico`,
    type: 'website',
  };
}

function getDomain(urlString: string): string {
  try {
    const urlObj = new URL(urlString);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

const VALID_BLOCK_ID_REGEX = /^[0-9a-f]{8,10}$/i;

/**
 * Link Block Main Hook
 *
 * All state, refs, effects, and handlers for the Link block.
 * Container passes return value to LinkView (presentational).
 */
export function useLinkBlock(props: LinkBlockHookProps): UseLinkBlockReturn {
  const { nodeData, selected, nodeId, updateBlockTitle } = props;
  const properties = nodeData.properties as LinkBlockProperties;
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

  const hasValidBlockId =
    nodeData.blockId && VALID_BLOCK_ID_REGEX.test(nodeData.blockId);

  const [metadata, setMetadata] = useState<OpenGraphMetadata | null>(() => {
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

  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string>(url);
  const fetchedForUrlRef = useRef<string | null>(null);
  const summaryReportedForBlockRef = useRef<string | null>(null);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { setAutoSummaryBlockId } = useAIActionContext();
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: { getNode, updateNode },
  });

  const normalizedDomain = useMemo(() => {
    const baseDomain = (
      metadata?.domain?.trim() || (url ? getDomain(url) : '')
    ).trim();
    if (!baseDomain) return '';
    return baseDomain
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }, [metadata?.domain, url]);

  /** metadata.faviconUrl 사용, 없으면 DuckDuckGo fallback */
  const currentFaviconUrl = useMemo(() => {
    if (metadata?.faviconUrl?.trim()) return metadata.faviconUrl.trim();
    if (normalizedDomain)
      return `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`;
    return null;
  }, [metadata?.faviconUrl, normalizedDomain]);

  const fetchMetadata = useCallback(
    async (urlString: string) => {
      if (!urlString) {
        setMetadata(null);
        return;
      }
      if (!hasValidBlockId || !workspaceId || !orgId) {
        return;
      }
      setIsLoading(true);
      setHasError(false);
      let resultMetadata: OpenGraphMetadata;
      let hasErr = false;

      try {
        const actionResult = await fetchLinkMetadataAction({
          workspaceId,
          blockId: nodeData.blockId!,
          url: urlString,
        });
        if (actionResult.success && actionResult.data) {
          resultMetadata = actionResult.data.metadata;
          const { sourceId, blockUuid } = actionResult.data;
          // updateProperties: onMutate에서 updateNode 동기 실행 → Editor Panel 탭 데이터 동기화 (YouTube 패턴)
          await updateProperties(
            nodeData.blockId!,
            {
              ogTitle: resultMetadata.title,
              ogDescription: resultMetadata.description,
              ogImage: resultMetadata.imageUrl,
              siteName: resultMetadata.siteName,
              domain: resultMetadata.domain,
              faviconUrl: resultMetadata.faviconUrl,
              author: resultMetadata.author,
              publishedAt: resultMetadata.publishedAt,
              pageType: resultMetadata.type,
              ...(sourceId && { sourceId }),
            },
            nodeData
          );
          if (sourceId && blockUuid && summaryReportedForBlockRef.current !== blockUuid) {
            summaryReportedForBlockRef.current = blockUuid;
            setAutoSummaryBlockId(blockUuid);
          }
          if (sourceId && updateBlockTitle) {
            const titleToSet = (resultMetadata.title || '').trim();
            if (titleToSet) {
              await updateBlockTitle({
                nodeId,
                title: titleToSet,
                blockData: { ...nodeData, sourceId },
              });
            }
          }
        } else {
          hasErr = true;
          resultMetadata = buildFallbackMetadata(getDomain(urlString), urlString);
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        hasErr = true;
        resultMetadata = buildFallbackMetadata(getDomain(urlString), urlString);
      }

      setHasError(hasErr);
      setMetadata(resultMetadata);
      fetchedForUrlRef.current = urlString;
      setIsLoading(false);
    },
    [
      hasValidBlockId,
      workspaceId,
      orgId,
      nodeData,
      updateBlockTitle,
      updateProperties,
      setAutoSummaryBlockId,
    ]
  );

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

  useEffect(() => {
    if (url) {
      const hasUrlChanged = prevUrlRef.current !== url;
      const hasNoMetadata = !ogTitle && !ogDescription && !ogImage;
      const alreadyFetched = fetchedForUrlRef.current === url;
      const willFetch =
        hasValidBlockId &&
        (hasUrlChanged || hasNoMetadata) &&
        !alreadyFetched;
      if (hasUrlChanged) {
        fetchedForUrlRef.current = null;
        summaryReportedForBlockRef.current = null;
      }
      if (willFetch) {
        fetchMetadata(url);
        prevUrlRef.current = url;
      } else {
        prevUrlRef.current = url;
      }
    } else {
      setMetadata(null);
      prevUrlRef.current = '';
      fetchedForUrlRef.current = null;
      summaryReportedForBlockRef.current = null;
    }
  }, [url, hasValidBlockId, fetchMetadata, ogTitle, ogDescription, ogImage]);

  useEffect(() => {
    if (selected && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected, url]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selected && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [selected, url]
  );

  const canPersistProperties = !nodeId.startsWith('optimistic-');

  const handleUrlSubmit = useCallback(
    async (e?: { preventDefault(): void }) => {
      if (e) {
        e.preventDefault();
        (e as unknown as { stopPropagation?(): void }).stopPropagation?.();
      }
      if (!draftUrl.trim()) return;
      if (!canPersistProperties || !hasValidBlockId) {
        setDraftUrl('');
        return;
      }
      try {
        await updateProperty(
          nodeData.blockId,
          'properties.url',
          draftUrl.trim(),
          nodeData
        );
        setDraftUrl('');
      } catch (error) {
        console.error('Failed to save URL:', error);
      }
    },
    [canPersistProperties, hasValidBlockId, draftUrl, updateProperty, nodeData]
  );

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftUrl(e.target.value);
  }, []);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleUrlSubmit();
      } else if (e.key === 'Escape') {
        setDraftUrl('');
        inputRef.current?.blur();
      }
    },
    [handleUrlSubmit]
  );

  return {
    url,
    metadata,
    isLoading,
    hasError,
    draftUrl,
    inputRef,
    normalizedDomain,
    currentFaviconUrl,
    handleUrlSubmit,
    handleUrlChange,
    handleUrlKeyDown,
    handleDoubleClick,
  };
}
