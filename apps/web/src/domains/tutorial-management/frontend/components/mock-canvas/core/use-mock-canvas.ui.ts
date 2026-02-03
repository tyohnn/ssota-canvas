'use client';

import { useState } from 'react';
import type { MockCanvasUIState } from './types';

/**
 * Mock Canvas UI Hook
 *
 * Manages UI state for the mock canvas
 */
export function useMockCanvasUI(): MockCanvasUIState {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [hasBlock, setHasBlock] = useState(false);

  return {
    showBlockMenu,
    hasBlock,
    setShowBlockMenu,
    setHasBlock,
  };
}
