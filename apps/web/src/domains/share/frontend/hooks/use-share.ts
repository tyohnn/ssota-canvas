'use client';

import { useCallback } from 'react';
import { useShareContext } from '../contexts/share-context';

export function useShare() {
  const context = useShareContext();

  const copyLinkToClipboard = useCallback(async (url: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }

    await navigator.clipboard.writeText(url);
  }, []);

  return {
    ...context,
    copyLinkToClipboard,
  };
}
