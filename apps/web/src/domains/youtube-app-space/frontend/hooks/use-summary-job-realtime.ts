'use client';

import { useState } from 'react';

import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks/use-supabase-realtime';

export type SummaryJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface SummaryJob {
  id: string;
  block_id: string;
  status: SummaryJobStatus;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export function useSummaryJobRealtime(blockId: string) {
  const [job, setJob] = useState<SummaryJob | null>(null);

  useSupabaseRealtime({
    table: 'summary_jobs',
    schema: 'youtube_app_space',
    event: '*',
    filter: `block_id=eq.${blockId}`,
    onEvent: (payload: { eventType?: string; new?: SummaryJob }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          setJob(payload.new as SummaryJob);
        }
      }
    },
    enabled: !!blockId,
  });

  const isProcessing =
    job?.status === 'pending' || job?.status === 'processing';
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';

  return {
    job,
    isProcessing,
    isCompleted,
    isFailed,
    errorMessage: job?.error_message,
  };
}
