'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';


export function usePublishPageClient() {
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'copy') {
      setIsDialogOpen(true);
    }
  }, [action]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  return {
    isDialogOpen,
    onDialogOpenChange: handleDialogOpenChange,
  };
}
