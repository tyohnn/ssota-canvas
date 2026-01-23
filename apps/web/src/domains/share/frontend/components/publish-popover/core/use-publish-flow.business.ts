'use client';

import { useCallback } from 'react';

import { usePublishPage } from '@/domains/share/frontend/hooks/use-publish-page';
import { useShare } from '@/domains/share/frontend/hooks/use-share';
import { useUnpublishPage } from '@/domains/share/frontend/hooks/use-unpublish-page';

interface UsePublishFlowBusinessProps {
  pageId: string;
  publishUrl: string | null;
  onPublished?: (publishUrl: string) => void;
  onUnpublished?: () => void;
  setError: (error: string | null) => void;
  setIsLinkCopied: (copied: boolean) => void;
}

export function usePublishFlowBusiness({
  pageId,
  publishUrl,
  onPublished,
  onUnpublished,
  setError,
  setIsLinkCopied,
}: UsePublishFlowBusinessProps) {
  const { copyLinkToClipboard } = useShare();
  const { publishPage, isPublishing } = usePublishPage({
    onSuccess: result => {
      // 프론트엔드에서 publishToken으로 URL 생성
      const publishUrl = `/p/${result.publishToken}`;
      onPublished?.(publishUrl);
    },
    onError: () => {
      setError('Failed to publish');
    },
  });
  const { unpublishPage, isUnpublishing } = useUnpublishPage({
    onSuccess: () => {
      onUnpublished?.();
    },
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
