/**
 * UI State Hook for URL Toolbar Item
 *
 * Pure UI logic that can be used by designers in Storybook/no-code tools
 * - No business logic (API calls, data validation, etc.)
 * - Only handles local state management
 * - Can be tested independently in no-code environments
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { UrlToolbarItemUIState } from './types';

export interface UseUrlToolbarItemUIProps {
  currentValue: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export function useUrlToolbarItemUI({
  currentValue,
  onCancel,
  onSubmit,
}: UseUrlToolbarItemUIProps): UrlToolbarItemUIState {
  const [isOpen, setIsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(currentValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // currentValue가 변경되면 draftUrl 동기화
  useEffect(() => {
    setDraftUrl(currentValue);
  }, [currentValue]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // Popover가 닫히면 draftUrl을 currentValue로 리셋
        setDraftUrl(currentValue);
      }
    },
    [currentValue, setDraftUrl]
  );

  const handleCancel = useCallback(() => {
    setDraftUrl(currentValue);
    setIsOpen(false);
    onCancel();
  }, [currentValue, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();

      if (e.key === 'Enter') {
        onSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [onSubmit, handleCancel]
  );

  return {
    isOpen,
    draftUrl,
    isSubmitting,
    inputRef,
    setIsOpen,
    setDraftUrl,
    setIsSubmitting,
    handleOpenChange,
    handleCancel,
    handleKeyDown,
  };
}
