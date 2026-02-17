import type { EventLogService } from './event-log.service';

/**
 * Context passed to block domain Event.handle() to trigger event-logging policy (optional).
 * When provided, BlockMountedEvent / BlockMountDeletedEvent etc. call eventLogService
 * to log block_created / block_mount_soft_deleted (soft delete) to event_logs.
 *
 * - pageId: 직접 전달 시 그대로 사용.
 * - getPageIdForBlock: 전달 시 이벤트 핸들러에서 blockId로 pageId를 조회해 로깅. (액션에서 블록 조회 중복 제거용)
 */
export interface EventLogPolicyContext {
  eventLogService: EventLogService;
  userId: string;
  blockType?: string;
  pageId?: string;
  blockId?: string;
  /** blockId(UUID)로 마운트된 pageId 조회. 이벤트 핸들러가 로깅 시 pageId가 없을 때 직접 호출 */
  getPageIdForBlock?: (blockId: string) => Promise<string | null>;
}
