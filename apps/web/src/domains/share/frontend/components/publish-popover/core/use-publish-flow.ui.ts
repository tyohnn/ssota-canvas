'use client';

import { useState } from 'react';

export function usePublishFlowUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  return {
    isOpen,
    setIsOpen,
    error,
    setError,
    isLinkCopied,
    setIsLinkCopied,
  };
}
