'use client';

import { useState } from 'react';
import type { MockCanvasUIState } from './types';

/**
 * Mock Canvas UI Hook
 *
 * Manages UI state for the mock canvas
 */
export function useMockCanvasUI(): MockCanvasUIState {
  const [hasBlock, setHasBlock] = useState(false);

  return {
    hasBlock,
    setHasBlock,
  };
}
