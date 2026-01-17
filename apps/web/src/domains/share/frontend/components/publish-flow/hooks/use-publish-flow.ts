'use client';

import { useMemo, useEffect, useState } from 'react';
import { usePublishedLink } from '../../../hooks/use-get-published-link';
import { usePublishFlowUI } from './use-publish-flow.ui';
import { usePublishFlowBusiness } from './use-publish-flow.business';

interface UsePublishFlowProps {
  pageId: string;
  onPublished?: (publishUrl: string) => void;
}

export function usePublishFlow({ pageId, onPublished }: UsePublishFlowProps) {
  const ui = usePublishFlowUI();
  const { getPublishedLink, isGettingLink } = usePublishedLink();
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  // 초기 로드 시 링크 조회
  useEffect(() => {
    const loadLink = async () => {
      setIsLoadingLink(true);
      const linkData = await getPublishedLink({ pageId });
      setPublishUrl(linkData?.publishUrl ?? null);
      setIsLoadingLink(false);
    };
    loadLink();
  }, [pageId, getPublishedLink]);

  const business = usePublishFlowBusiness({
    pageId,
    publishUrl,
    onPublished: (url) => {
      setPublishUrl(url);
      onPublished?.(url);
    },
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
    isLoading: isLoadingLink || isGettingLink,
    isSubmitting: business.isPublishing,
    isUnpublishing: business.isUnpublishing,
    error: ui.error,
    publishUrl,
    normalizedUrl,
  };
}
