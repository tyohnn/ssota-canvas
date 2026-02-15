import type { EventLogService } from './event-log.service';

/**
 * Context passed to block domain Event.handle() to trigger event-logging policy (optional).
 * When provided, BlockMountedEvent / BlockMountDeletedEvent etc. call eventLogService
 * to log block_created / block_mount_soft_deleted (soft delete) to event_logs.
 */
export interface EventLogPolicyContext {
  eventLogService: EventLogService;
  userId: string;
  blockType?: string;
  pageId?: string;
  blockId?: string;
}
