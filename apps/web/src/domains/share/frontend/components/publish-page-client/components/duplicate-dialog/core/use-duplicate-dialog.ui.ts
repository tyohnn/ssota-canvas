'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export function useDuplicateDialogUI() {
  const searchParams = useSearchParams();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // URL 파라미터 체크
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'duplicate') {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const onDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  return {
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    isDialogOpen,
    onDialogOpenChange,
  };
}
