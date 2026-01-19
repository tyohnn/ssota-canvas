'use client';

import { useCallback } from 'react';

export function useShare() {
  const copyLinkToClipboard = useCallback(async (url: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }

    await navigator.clipboard.writeText(url);
  }, []);

  return {
    copyLinkToClipboard,
  };
}
