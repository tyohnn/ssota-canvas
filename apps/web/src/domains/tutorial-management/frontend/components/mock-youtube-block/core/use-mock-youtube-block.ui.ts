'use client';

import { useState } from 'react';
import type { MockYoutubeBlockUIState } from './types';

/**
 * Mock YouTube Block UI Hook
 *
 * Manages UI state for the mock YouTube block
 */
export function useMockYoutubeBlockUI(): MockYoutubeBlockUIState {
  const [url, setUrl] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  return {
    url,
    showPlayer,
    setUrl,
    setShowPlayer,
  };
}
