'use client';

import { useCallback, useState } from 'react';

import type { DriveBlockTypeTab } from './types';

export function useDriveAddDialogUI() {
  const [activeTab, setActiveTab] = useState<DriveBlockTypeTab>('markdown');

  const reset = useCallback(() => {
    setActiveTab('markdown');
  }, []);

  return {
    activeTab,
    setActiveTab,
    reset,
  };
}
