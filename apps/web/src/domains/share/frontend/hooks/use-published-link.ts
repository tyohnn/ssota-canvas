'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublishedLinkAction } from '../../actions/share.actions';
import { PublishedLinkViewDTO } from '../../shared/dtos';

export function usePublishedLink(pageId: string | null) {
  return useQuery<PublishedLinkViewDTO | null>({
    queryKey: ['published-link', pageId],
    queryFn: () => (pageId ? getPublishedLinkAction({ pageId }) : Promise.resolve(null)),
    enabled: !!pageId,
  });
}
