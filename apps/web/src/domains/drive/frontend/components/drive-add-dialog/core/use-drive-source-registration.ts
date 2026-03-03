'use client';

import { useCallback, useState } from 'react';

import { ensureSourceAndJobAction } from '@/domains/source-management/actions/source/ensure-source-and-job.action';

export interface EnsureSourceJobParams {
  workspaceId: string;
  blockId: string;
  url: string;
  sourceType: 'pdf' | 'audio' | 'youtube' | 'link' | 'x';
}

export function useDriveSourceRegistration() {
  const [isLoading, setIsLoading] = useState(false);

  const ensureSourceJob = useCallback(async (params: EnsureSourceJobParams) => {
    setIsLoading(true);
    try {
      const result = await ensureSourceAndJobAction({
        workspaceId: params.workspaceId,
        blockId: params.blockId,
        url: params.url,
        sourceType: params.sourceType,
      });
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    ensureSourceJob,
    isLoading,
  };
}
