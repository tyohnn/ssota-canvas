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
  const publishMutation = usePublishPage();
  const unpublishMutation = useUnpublishPage();

  const handlePublish = useCallback(async () => {
    setError(null);
    try {
      const result = await publishMutation.mutateAsync({ pageId });
      onPublished?.(result.publishUrl);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to publish');
    }
  }, [pageId, publishMutation, onPublished, setError]);

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
    try {
      await unpublishMutation.mutateAsync({ pageId });
    } catch (err) {
      setError((err as Error).message ?? 'Failed to unpublish');
    }
  }, [pageId, unpublishMutation, setError]);

  return {
    publishMutation,
    unpublishMutation,
    handlePublish,
    handleCopy,
    handleUnpublish,
  };
}
