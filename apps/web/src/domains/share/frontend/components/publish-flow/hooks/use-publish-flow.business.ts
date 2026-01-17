'use client';

import { useCallback } from 'react';
import { useShare } from '../../../hooks/use-share';
import { usePublishPage } from '../../../hooks/use-publish-page';
import { useUnpublishPage } from '../../../hooks/use-unpublish-page';

interface UsePublishFlowBusinessProps {
  pageId: string;
  publishUrl: string | null;
  onPublished?: (publishUrl: string) => void;
  setError: (error: string | null) => void;
  setIsLinkCopied: (copied: boolean) => void;
}

export function usePublishFlowBusiness({
  pageId,
  publishUrl,
  onPublished,
  setError,
  setIsLinkCopied,
}: UsePublishFlowBusinessProps) {
  const { copyLinkToClipboard } = useShare();
  const { publishPage, isPublishing } = usePublishPage({
    onSuccess: (result) => {
      onPublished?.(result.publishUrl);
    },
    onError: () => {
      setError('Failed to publish');
    },
  });
  const { unpublishPage, isUnpublishing } = useUnpublishPage({
    onError: () => {
      setError('Failed to unpublish');
    },
  });

  const handlePublish = useCallback(async () => {
    setError(null);
    const result = await publishPage({ pageId });
    if (!result) {
      setError('Failed to publish');
    }
  }, [pageId, publishPage, setError]);

  const handleCopy = useCallback(async () => {
    if (!publishUrl) return;
    const fullUrl = publishUrl.startsWith('http')
      ? publishUrl
      : `${window.location.origin}${publishUrl}`;
    await copyLinkToClipboard(fullUrl);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 1200);
  }, [publishUrl, copyLinkToClipboard, setIsLinkCopied]);

  const handleUnpublish = useCallback(async () => {
    setError(null);
    const success = await unpublishPage({ pageId });
    if (!success) {
      setError('Failed to unpublish');
    }
  }, [pageId, unpublishPage, setError]);

  return {
    isPublishing,
    isUnpublishing,
    handlePublish,
    handleCopy,
    handleUnpublish,
  };
}
