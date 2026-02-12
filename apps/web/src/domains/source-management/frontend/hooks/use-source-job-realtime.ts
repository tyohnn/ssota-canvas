'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

import { useSupabaseRealtime } from '@/domains/realtime-management/frontend/hooks/use-supabase-realtime';
import { createClient } from '@/utils/supabase/browser';

export type SourceJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface SourceJob {
  id: string;
  block_id: string;
  language?: string;
  status: SourceJobStatus;
  current_step: 'extracting' | 'summarizing' | null;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/** Fetch로 받은 진행 중 job (새로고침 직후 Realtime 전 초기 상태) */
export type InitialSourceJob = SourceJob | null;

export function useSourceJobRealtime(
  blockId: string,
  initialJob: InitialSourceJob = null
) {
  const [job, setJob] = useState<SourceJob | null>(null);

  // Fetch에서 받은 job을 즉시 반영 (Realtime은 구독 후 이벤트만 오므로 초기 상태 필요)
  // initialJob이 null이어도 이미 completed인 job은 유지 (invalidate 후 refetch가 null을 주어 completed 상태를 덮어쓰지 않음, Issue 2)
  useEffect(() => {
    if (!blockId) {
      setJob(null);
      return;
    }
    if (initialJob && initialJob.block_id === blockId) {
      setJob(initialJob);
    } else if (initialJob == null) {
      setJob(prev =>
        prev?.status === 'completed' && prev?.block_id === blockId ? prev : null
      );
    } else {
      setJob(null);
    }
  }, [blockId, initialJob?.id, initialJob?.block_id, initialJob?.status]);

  useSupabaseRealtime({
    table: 'source_jobs',
    schema: 'public',
    event: '*',
    filter: `block_id=eq.${blockId}`,
    onEvent: (payload: { eventType?: string; new?: SourceJob }) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          setJob(payload.new as SourceJob);
        }
      }
    },
    enabled: !!blockId,
  });

  const isProcessing =
    job?.status === 'pending' || job?.status === 'processing';
  const isExtracting = job?.current_step === 'extracting';
  const isSummarizing = job?.current_step === 'summarizing';
  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const failedStep = isFailed ? job?.current_step ?? null : null;

  return {
    job,
    isProcessing,
    isExtracting,
    isSummarizing,
    isCompleted,
    isFailed,
    failedStep,
    errorMessage: job?.error_message,
  };
}

/**
 * 다중 block_id에 대해 source_jobs Realtime 구독.
 * 이벤트 시 콜백으로 (blockId, newJob) 전달.
 */
export function useMultiSourceJobRealtime(
  blockIds: string[],
  onJobUpdate: (blockId: string, job: SourceJob) => void
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
          .channel(`source_jobs-${blockId}`)
          .on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: 'public',
              table: 'source_jobs',
              filter: `block_id=eq.${blockId}`,
            },
            (payload: { eventType?: string; new?: SourceJob }) => {
              if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
                onJobUpdateRef.current(blockId, payload.new as SourceJob);
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
