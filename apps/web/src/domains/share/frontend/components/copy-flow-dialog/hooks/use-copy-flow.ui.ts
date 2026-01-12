'use client';

import { useState } from 'react';

export function useCopyFlowUI() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'idle' | 'success' | 'failed'>('idle');

  return {
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    error,
    setError,
    result,
    setResult,
  };
}
