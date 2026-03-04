'use client';

import { useState, useCallback } from 'react';

export type DriveTypeFilter =
  | null
  | 'link'
  | 'audio'
  | 'markdown'
  | 'pdf'
  | 'youtube'
  | 'image';

export function useDriveGridUI() {
  const [typeFilter, setTypeFilter] = useState<DriveTypeFilter>(null);
  return {
    typeFilter,
    setTypeFilter: useCallback((value: DriveTypeFilter) => setTypeFilter(value), []),
  };
}
