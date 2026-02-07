/**
 * Queue Adapter Interface
 *
 * Agnostic contract for message queue (producer). Implementation can be
 * Supabase pgmq, SQS, Redis, etc. Callers depend only on this interface.
 */

export interface SendMessageOptions {
  /** Delay before message becomes visible (seconds). */
  delaySeconds?: number;
}

/**
 * Queue adapter: send message to a named queue.
 * Returns opaque message id from the underlying system (e.g. pgmq msg_id).
 */
export interface IQueueAdapter {
  send(
    queueName: string,
    message: Record<string, unknown>,
    options?: SendMessageOptions
  ): Promise<string | number>;
}
