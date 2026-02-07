/**
 * Supabase pgmq Queue Adapter
 *
 * Implementation of IQueueAdapter using Supabase pgmq_public.send RPC.
 * Queue system is treated as a black box; this adapter can be swapped.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { IQueueAdapter, SendMessageOptions } from '../interfaces/queue-adapter.interface';

export interface SupabasePgmqQueueAdapterDeps {
  supabase: SupabaseClient;
}

/**
 * Queue adapter implementation using Supabase pgmq (pgmq_public.send).
 */
export function createSupabasePgmqQueueAdapter(
  deps: SupabasePgmqQueueAdapterDeps
): IQueueAdapter {
  const { supabase } = deps;

  return {
    async send(
      queueName: string,
      message: Record<string, unknown>,
      options?: SendMessageOptions
    ): Promise<number> {
      const { data, error } = await supabase
        .schema('pgmq_public')
        .rpc('send', {
          queue_name: queueName,
          message,
          sleep_seconds: options?.delaySeconds ?? 0,
        });

      if (error) {
        throw new Error(`pgmq send failed: ${error.message}`);
      }

      // pgmq returns bigint message id
      const msgId = data as number | null | undefined;
      if (msgId == null) {
        throw new Error('pgmq send returned no message id');
      }
      return Number(msgId);
    },
  };
}
