'use client';

import { useMemo } from 'react';
import { usePublishedLink } from '../../../hooks/use-published-link';
import { usePublishFlowUI } from './use-publish-flow.ui';
import { usePublishFlowBusiness } from './use-publish-flow.business';

interface UsePublishFlowProps {
  pageId: string;
  onPublished?: (publishUrl: string) => void;
}

export function usePublishFlow({ pageId, onPublished }: UsePublishFlowProps) {
  const ui = usePublishFlowUI();
  const { data: linkData, isLoading: isLinkLoading } = usePublishedLink(pageId);
  const publishUrl = linkData?.publishUrl ?? null;

  const business = usePublishFlowBusiness({
    pageId,
    publishUrl,
    onPublished,
    setError: ui.setError,
    setIsLinkCopied: ui.setIsLinkCopied,
  });

  const normalizedUrl = useMemo(() => {
    if (!publishUrl) return null;
    const fullUrl = publishUrl.startsWith('http')
      ? publishUrl
      : `${window.location.origin}${publishUrl}`;
    return fullUrl;
  }, [publishUrl]);

  return {
    ...ui,
    ...business,
    isLoading: isLinkLoading,
    isSubmitting: business.publishMutation.isPending,
    isUnpublishing: business.unpublishMutation.isPending,
    error: ui.error || (business.publishMutation.error?.message) || (business.unpublishMutation.error?.message) || null,
    publishUrl,
    normalizedUrl,
  };
}
