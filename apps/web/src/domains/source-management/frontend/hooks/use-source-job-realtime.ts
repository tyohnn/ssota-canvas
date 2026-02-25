'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * useSourceJobRealtime
 *
 * 블록의 source job 상태 (Realtime 구독 + 완료 시 invalidation, tabOptions clear)
 * 단일 책임: "이 블록의 job 상태와 Realtime 연동"
 */
export function useSourceJobRealtime(
  blockId: string,
  initialJob: InitialSourceJob = null
) {
  const [job, setJob] = useState<SourceJob | null>(null);

  /**
   * initialJob(Fetch)과 job(Realtime) 동기화
   *
   * - initialJob: getInProgressSourceJobByBlockId API 결과. pending/processing job만 반환.
   * - Realtime: source_jobs INSERT/UPDATE 이벤트. 구독 후에만 수신하므로 초기 상태는 initialJob 필요.
   *
   * 타이밍 이슈: Realtime으로 job 완료 → 상위에서 invalidate(source-job-in-progress) →
   * refetch → API는 in-progress만 반환하므로 null 반환 → initialJob이 null로 바뀜.
   * 이때 initialJob == null을 단순히 setJob(null)로 처리하면, Realtime에서 받은 completed
   * 상태가 지워져 UI가 "완료"에서 빈 상태로 깜빡임. 따라서 initialJob이 null이어도
   * prev가 completed이고 block_id가 같으면 유지함.
   */
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

  const onEvent = useCallback((payload: { eventType?: string; new?: SourceJob }) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      if (payload.new) {
        const job = payload.new as SourceJob;
        console.log('[useSourceJobRealtime] postgres_changes event', {
          blockId,
          eventType: payload.eventType,
          status: job.status,
          current_step: job.current_step,
        });
        setJob(job);
      }
    }
  }, [blockId]);

  useSupabaseRealtime({
    table: 'source_jobs',
    schema: 'public',
    event: '*',
    filter: `block_id=eq.${blockId}`,
    onEvent,
    enabled: !!blockId,
    channelName: blockId ? `source_jobs-${blockId}` : undefined,
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
      console.log('[useMultiSourceJobRealtime] setup start', { blockIds });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[useMultiSourceJobRealtime] User not authenticated, skipping subscription');
        return;
      }
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
            (payload: { eventType?: string; new?: SourceJob;[k: string]: unknown }) => {
              const job = payload.new as SourceJob | undefined;
              console.log('[useMultiSourceJobRealtime] postgres_changes event received', {
                blockId,
                eventType: payload.eventType,
                status: job?.status,
                current_step: job?.current_step,
                hasNew: !!payload.new,
              });
              if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
                onJobUpdateRef.current(blockId, payload.new as SourceJob);
              }
            }
          )
          .subscribe((status, err) => {
            console.log('[useMultiSourceJobRealtime] channel subscribe status', {
              blockId,
              status,
              err: err?.message ?? err,
            });
          });
        channels.push(channel);
      });
    };

    setup();
    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [blockIds.join(',')]);
}
