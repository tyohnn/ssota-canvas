'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  parseTypeFilterFromSearch,
  type DriveTypeFilter,
} from '@/domains/drive/frontend/hooks/drive-blocks-query';

/**
 * Syncs Drive type filter with URL ?type= query param.
 * Changing filter updates the URL (triggers server prefetch on navigation).
 */
export function useDriveTypeFilterFromUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const typeFilter = parseTypeFilterFromSearch(searchParams.get('type'));

  const setTypeFilter = useCallback(
    (value: DriveTypeFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('type', value);
      } else {
        params.delete('type');
      }
      const search = params.toString();
      const url = pathname + (search ? `?${search}` : '');
      router.replace(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { typeFilter, setTypeFilter };
}
