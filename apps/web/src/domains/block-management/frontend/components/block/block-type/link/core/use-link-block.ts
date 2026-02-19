'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useReactFlow } from '@xyflow/react';

import { fetchLinkMetadataAction } from '@/domains/block-management/actions/link.actions';
import { fetchOpenGraphMetadata } from '@/domains/block-management/actions/opengraph.actions';
import type { OpenGraphMetadata } from '@/domains/block-management/actions/opengraph.actions';
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

  const canPersistProperties = !nodeId.startsWith('optimistic-');

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
  const [faviconIndex, setFaviconIndex] = useState(0);
  const [isFaviconExhausted, setIsFaviconExhausted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string>(url);
  const lastPersistedFaviconRef = useRef<string | null>(null);

  const { workspaceId, orgId } = useCanvasMetadata();
  const { getNode, updateNode } = useReactFlow();
  const { updateProperty, updateProperties } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (id: string, options: { data: any }) => updateNode(id, options),
    },
  });

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
    if (!baseDomain) return '';
    return baseDomain
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }, [metadata?.domain, url, getDomain]);

  const sanitizeFaviconUrl = useCallback(
    (favicon?: string | null): string | null => {
      if (!favicon || !favicon.trim()) {
        if (!normalizedDomain) return null;
        return `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`;
      }
      const normalizedFavicon = favicon.trim();
      const lowercaseFavicon = normalizedFavicon.toLowerCase();
      const needsReplacement =
        lowercaseFavicon.includes('google.com/s2/favicons') ||
        lowercaseFavicon.includes('gstatic.com/favicon');
      if (needsReplacement) {
        if (!normalizedDomain) return null;
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
    if (!metadata) return;
    const targetFavicon =
      sanitizedMetadataFavicon ||
      (normalizedDomain
        ? `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`
        : '');
    if (metadata.faviconUrl !== targetFavicon) {
      setMetadata(prev =>
        prev ? { ...prev, faviconUrl: targetFavicon } : prev
      );
      if (targetFavicon && lastPersistedFaviconRef.current !== targetFavicon) {
        lastPersistedFaviconRef.current = targetFavicon;
        if (canPersistProperties) {
          updateProperties(
            nodeData.blockId,
            { faviconUrl: targetFavicon },
            nodeData
          ).catch(err => console.error('Failed to persist favicon URL:', err));
        }
      }
    }
  }, [
    canPersistProperties,
    metadata,
    sanitizedMetadataFavicon,
    normalizedDomain,
    updateProperties,
    nodeData,
  ]);

  const faviconCandidates = useMemo(() => {
    const candidates: string[] = [];
    if (sanitizedMetadataFavicon) candidates.push(sanitizedMetadataFavicon);
    if (normalizedDomain) {
      candidates.push(`https://${normalizedDomain}/favicon.ico`);
      candidates.push(`https://${normalizedDomain}/apple-touch-icon.png`);
      candidates.push(
        `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`
      );
    }
    const absoluteCandidates = candidates
      .filter(Boolean)
      .map(c => {
        if (!c) return '';
        if (/^https?:\/\//i.test(c)) return c;
        if (!normalizedDomain) return c;
        return `https://${normalizedDomain}/${c.replace(/^\/+/, '')}`;
      })
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(absoluteCandidates));
  }, [sanitizedMetadataFavicon, normalizedDomain]);

  const currentFaviconUrl: string | null =
    !isFaviconExhausted && faviconCandidates.length > 0
      ? faviconCandidates[Math.min(faviconIndex, faviconCandidates.length - 1)] ??
        null
      : null;

  useEffect(() => {
    setFaviconIndex(0);
    setIsFaviconExhausted(false);
  }, [faviconCandidates]);

  const handleFaviconError = useCallback(() => {
    setFaviconIndex(prevIndex => {
      const next = prevIndex + 1;
      if (next < faviconCandidates.length) return next;
      setIsFaviconExhausted(true);
      return prevIndex;
    });
  }, [faviconCandidates.length]);

  const persistMetadata = useCallback(
    async (data: OpenGraphMetadata) => {
      if (!canPersistProperties) return;
      await updateProperties(
        nodeData.blockId,
        {
          ogTitle: data.title,
          ogDescription: data.description,
          ogImage: data.imageUrl,
          siteName: data.siteName,
          domain: data.domain,
          faviconUrl: data.faviconUrl,
          author: data.author,
          publishedAt: data.publishedAt,
          pageType: data.type,
        },
        nodeData
      );
      const titlePart = (data.title || '').trim();
      const sitePart = (data.siteName || '').trim();
      const titleToSet =
        sitePart && titlePart
          ? `${sitePart} | ${titlePart}`
          : titlePart || sitePart;
      if (titleToSet && updateBlockTitle) {
        await updateBlockTitle({
          nodeId,
          title: titleToSet,
          blockData: nodeData,
        });
      }
    },
    [
      canPersistProperties,
      updateProperties,
      nodeData,
      nodeId,
      updateBlockTitle,
    ]
  );

  const fetchMetadata = useCallback(
    async (urlString: string) => {
      if (!urlString) {
        setMetadata(null);
        return;
      }
      setIsLoading(true);
      setHasError(false);
      let metadata: OpenGraphMetadata;
      let hasError = false;

      try {
        // Use fetchLinkMetadataAction for persisted blocks (Source domain integration)
        if (
          canPersistProperties &&
          workspaceId &&
          orgId &&
          nodeData.blockId &&
          /^[0-9a-f]{8,10}$/i.test(nodeData.blockId)
        ) {
          const actionResult = await fetchLinkMetadataAction({
            workspaceId,
            blockId: nodeData.blockId,
            url: urlString,
            language: 'ko',
          });
          if (actionResult.success && actionResult.data) {
            metadata = actionResult.data.metadata;
            if (actionResult.data.sourceId) {
              updateNode(nodeId, {
                data: { ...nodeData, sourceId: actionResult.data.sourceId },
              });
              if (updateBlockTitle) {
                const titlePart = (metadata.title || '').trim();
                const sitePart = (metadata.siteName || '').trim();
                const titleToSet =
                  sitePart && titlePart
                    ? `${sitePart} | ${titlePart}`
                    : titlePart || sitePart;
                if (titleToSet) {
                  await updateBlockTitle({
                    nodeId,
                    title: titleToSet,
                    blockData: { ...nodeData, sourceId: actionResult.data.sourceId },
                  });
                }
              }
            }
          } else {
            hasError = true;
            metadata = buildFallbackMetadata(getDomain(urlString), urlString);
          }
        } else {
          // Fallback: OG fetch only (optimistic blocks or missing context)
          const result = await fetchOpenGraphMetadata(urlString);
          if (result.success) {
            metadata = result.data;
          } else {
            hasError = true;
            metadata = buildFallbackMetadata(getDomain(urlString), urlString);
          }
          if (canPersistProperties) {
            try {
              await persistMetadata(metadata);
            } catch (e) {
              console.error('Failed to save metadata:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        hasError = true;
        metadata = buildFallbackMetadata(getDomain(urlString), urlString);
      }

      setHasError(hasError);
      setMetadata(metadata);
      setIsLoading(false);
    },
    [
      canPersistProperties,
      workspaceId,
      orgId,
      nodeData,
      nodeId,
      getDomain,
      persistMetadata,
      updateBlockTitle,
      updateNode,
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
      if (hasUrlChanged || hasNoMetadata) {
        fetchMetadata(url);
        prevUrlRef.current = url;
      }
    } else {
      setMetadata(null);
      prevUrlRef.current = '';
    }
  }, [url, fetchMetadata, ogTitle, ogDescription, ogImage]);

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

  const handleUrlSubmit = useCallback(
    async (e?: { preventDefault(): void }) => {
      if (e) {
        e.preventDefault();
        (e as unknown as { stopPropagation?(): void }).stopPropagation?.();
      }
      if (!draftUrl.trim()) return;
      if (!canPersistProperties) {
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
    [canPersistProperties, draftUrl, updateProperty, nodeData]
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
    faviconIndex,
    isFaviconExhausted,
    inputRef,
    normalizedDomain,
    currentFaviconUrl,
    handleUrlSubmit,
    handleUrlChange,
    handleUrlKeyDown,
    handleDoubleClick,
    handleFaviconError,
  };
}
