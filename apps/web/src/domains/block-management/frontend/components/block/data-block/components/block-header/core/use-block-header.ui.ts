import { useEffect, useRef, useState } from 'react';

import type { BlockHeaderUIState } from './types';

/**
 * UI State Hook for Block Header
 *
 * Pure UI logic that can be used by designers in Storybook/no-code tools
 * - No business logic (API calls, data validation, etc.)
 * - Only handles local state management
 * - Can be tested independently in no-code environments
 */
export function useBlockHeaderUI(initialTitle: string): BlockHeaderUIState {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync title when external data changes
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  return {
    title,
    setTitle,
    inputRef,
  };
}
