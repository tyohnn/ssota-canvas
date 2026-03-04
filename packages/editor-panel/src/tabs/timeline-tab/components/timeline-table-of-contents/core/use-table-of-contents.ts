'use client';

import { useCallback, useMemo } from 'react';
import { useTableOfContentsController } from '@workspace/ui/components/ssota-ui/table-of-contents';
import { formatTime, generateMinuteTOC, type TOCItem } from '../../../core/utils';
import { useActiveTime } from './use-active-time';

const COMPACT_LIMIT = 20;

export function useTableOfContents(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
) {
  const allTocItems = useMemo(() => generateMinuteTOC(transcript), [transcript]);
  const { activeTime } = useActiveTime(transcript, showTOC);

  const mapToUiItem = useCallback(
    (item: TOCItem): { id: string; label: string; widthHint: 'narrow' | 'wide' } => ({
      id: `${item.intervalType}-${item.minute}`,
      label: formatTime(item.startTime),
      widthHint: item.intervalType === '5min' ? 'narrow' : 'wide',
    }),
    []
  );

  const getIsDomainItemActive = useCallback(
    (item: TOCItem) => {
      if (activeTime === null) return false;
      const next = allTocItems.find((t) => t.startTime > item.startTime);
      const endTime = next ? next.startTime : Infinity;
      return activeTime >= item.startTime && activeTime < endTime;
    },
    [activeTime, allTocItems]
  );

  const onDomainItemClick = useCallback((item: TOCItem) => {
    const el = document.querySelector(`[data-segment-time="${item.startTime}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return useTableOfContentsController<TOCItem>({
    items: allTocItems,
    mapToUiItem,
    getIsDomainItemActive,
    onDomainItemClick,
    compactLimit: COMPACT_LIMIT,
  });
}
