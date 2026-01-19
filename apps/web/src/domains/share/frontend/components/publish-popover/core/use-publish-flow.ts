'use client';

import { useMemo, useEffect, useState } from 'react';
import { usePublishedLink } from '@/domains/share/frontend/hooks/use-get-published-link';
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
    let isMounted = true;
    
    const loadLink = async () => {
      setIsLoadingLink(true);
      const linkData = await getPublishedLink({ pageId });
      // 컴포넌트가 언마운트된 경우 상태 업데이트 방지
      if (!isMounted) return;
      // 프론트엔드에서 publishToken으로 URL 생성
      setPublishUrl(linkData?.publishToken ? `/p/${linkData.publishToken}` : null);
      setIsLoadingLink(false);
    };
    
    loadLink();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]); // getPublishedLink는 useCallback으로 메모이제이션되어 있지만, pageId 변경 시에만 재조회하도록 함

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
