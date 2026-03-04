'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  hasLinkMetadata,
  type LinkBlockHookProps,
  type LinkMetadata,
  type UseLinkBlockDeps,
  type UseLinkBlockReturn,
} from './types';
import { buildFallbackMetadata, getDomain } from './utils';

/**
 * Link Block Main Hook
 *
 * YouTube 패턴: 모든 도메인/프레임워크 의존성은 onUrlSubmit 콜백으로 위임.
 * View가 blockId, nodeId, nodeData, fetchMetadata, updateProperty 등을 보지 않음.
 */
export function useLinkBlock(
  props: LinkBlockHookProps,
  deps: UseLinkBlockDeps
): UseLinkBlockReturn {
  const { url, properties, isActive, instanceId, canPersist } = props;
  const {
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

  const [metadata, setMetadata] = useState<LinkMetadata | null>(() => {
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
  const fetchedForUrlRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

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

  const currentFaviconUrl = useMemo(() => {
    if (metadata?.faviconUrl?.trim()) return metadata.faviconUrl.trim();
    if (normalizedDomain)
      return `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`;
    return null;
  }, [metadata?.faviconUrl, normalizedDomain]);

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
      const urlChanged = fetchedForUrlRef.current !== url;
      const hasNoMetadata = !hasLinkMetadata(properties);
      const willFetch =
        !isFetchingRef.current &&
        (urlChanged ? hasNoMetadata || fetchedForUrlRef.current !== null : false);

      if (urlChanged) {
        fetchedForUrlRef.current = url;
      }

      if (willFetch) {
        isFetchingRef.current = true;
        setIsLoading(true);
        setHasError(false);

        deps
          .onUrlSubmit(url)
          .then(() => {
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Failed to fetch metadata:', err);
            setMetadata(
              buildFallbackMetadata(getDomain(url), url)
            );
            setHasError(true);
            setIsLoading(false);
          })
          .finally(() => {
            isFetchingRef.current = false;
          });
      } else if (!urlChanged && hasLinkMetadata(properties)) {
        setIsLoading(false);
      }
    } else {
      fetchedForUrlRef.current = null;
      setMetadata(null);
      setIsLoading(false);
    }
  }, [url, properties, deps.onUrlSubmit]);

  useEffect(() => {
    if (isActive && !url && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive, url]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isActive && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [isActive, url]
  );

  const handleUrlSubmit = useCallback(
    async (e?: { preventDefault(): void }) => {
      if (e) {
        e.preventDefault();
        (e as unknown as { stopPropagation?(): void }).stopPropagation?.();
      }
      const trimmed = draftUrl.trim();
      if (!trimmed || !canPersist || isFetchingRef.current) {
        if (!canPersist) setDraftUrl('');
        return;
      }
      isFetchingRef.current = true;
      setIsLoading(true);
      setHasError(false);
      setDraftUrl('');
      try {
        await deps.onUrlSubmit(trimmed);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to save URL:', err);
        setHasError(true);
        setIsLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [draftUrl, canPersist, deps.onUrlSubmit]
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
