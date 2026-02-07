'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks/use-supabase-realtime';
import { createClient } from '@/utils/supabase/browser';

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

/** Fetch로 받은 진행 중 job (새로고침 직후 Realtime 전 초기 상태) */
export type InitialSummaryJob = SummaryJob | null;

export function useSummaryJobRealtime(
  blockId: string,
  initialJob: InitialSummaryJob = null
) {
  const [job, setJob] = useState<SummaryJob | null>(null);

  // Fetch에서 받은 job을 즉시 반영 (Realtime은 구독 후 이벤트만 오므로 초기 상태 필요)
  useEffect(() => {
    if (!blockId) {
      setJob(null);
      return;
    }
    if (initialJob && initialJob.block_id === blockId) {
      setJob(initialJob);
    } else {
      setJob(null);
    }
  }, [blockId, initialJob?.id, initialJob?.block_id, initialJob?.status]);

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

/**
 * 다중 block_id에 대해 summary_jobs Realtime 구독.
 * 이벤트 시 콜백으로 (blockId, newJob) 전달.
 */
export function useMultiSummaryJobRealtime(
  blockIds: string[],
  onJobUpdate: (blockId: string, job: SummaryJob) => void
) {
  const supabaseRef = useRef(createClient());
  const onJobUpdateRef = useRef(onJobUpdate);
  onJobUpdateRef.current = onJobUpdate;

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channels: RealtimeChannel[] = [];

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      blockIds.forEach(blockId => {
        const channel = supabase
          .channel(`summary_jobs-${blockId}`)
          .on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: 'youtube_app_space',
              table: 'summary_jobs',
              filter: `block_id=eq.${blockId}`,
            },
            (payload: { eventType?: string; new?: SummaryJob }) => {
              if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
                onJobUpdateRef.current(blockId, payload.new as SummaryJob);
              }
            }
          )
          .subscribe();
        channels.push(channel);
      });
    };

    setup();
    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [blockIds.join(',')]);
}
