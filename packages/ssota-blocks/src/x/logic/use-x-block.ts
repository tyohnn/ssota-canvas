'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  hasXMetadata,
  type XBlockHookProps,
  type XMetadata,
  type UseXBlockDeps,
  type UseXBlockReturn,
} from './types';
import { buildFallbackMetadata } from './utils';

export function useXBlock(
  props: XBlockHookProps,
  deps: UseXBlockDeps
): UseXBlockReturn {
  const { url, properties, isActive, instanceId, canPersist } = props;
  const {
    xPostId,
    xText,
    xAuthorUsername,
    xAuthorName,
    xAuthorProfileImageUrl,
    xPostedAt,
    xLikeCount,
    xRetweetCount,
    xReplyCount,
    xEntities,
  } = properties;

  const [metadata, setMetadata] = useState<XMetadata | null>(() => {
    if (xPostId || xText) {
      return {
        postId: xPostId ?? '',
        text: xText ?? '',
        authorUsername: xAuthorUsername,
        authorName: xAuthorName,
        authorProfileImageUrl: xAuthorProfileImageUrl,
        postedAt: xPostedAt,
        likeCount: xLikeCount,
        retweetCount: xRetweetCount,
        replyCount: xReplyCount,
        entities: xEntities,
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

  useEffect(() => {
    if (xPostId || xText) {
      setMetadata({
        postId: xPostId ?? '',
        text: xText ?? '',
        authorUsername: xAuthorUsername,
        authorName: xAuthorName,
        authorProfileImageUrl: xAuthorProfileImageUrl,
        postedAt: xPostedAt,
        likeCount: xLikeCount,
        retweetCount: xRetweetCount,
        replyCount: xReplyCount,
        entities: xEntities,
      });
    }
  }, [
    xPostId,
    xText,
    xAuthorUsername,
    xAuthorName,
    xAuthorProfileImageUrl,
    xPostedAt,
    xLikeCount,
    xRetweetCount,
    xReplyCount,
    xEntities,
  ]);

  useEffect(() => {
    if (url) {
      const urlChanged = fetchedForUrlRef.current !== url;
      const hasNoMetadata = !hasXMetadata(properties);
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
            console.error('Failed to fetch X metadata:', err);
            setMetadata(buildFallbackMetadata(url));
            setHasError(true);
            setIsLoading(false);
          })
          .finally(() => {
            isFetchingRef.current = false;
          });
      } else if (!urlChanged && hasXMetadata(properties)) {
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
        console.error('Failed to save X URL:', err);
        setMetadata(buildFallbackMetadata(trimmed));
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
    handleUrlSubmit,
    handleUrlChange,
    handleUrlKeyDown,
    handleDoubleClick,
  };
}
