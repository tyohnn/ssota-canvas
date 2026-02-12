import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import type { RecentEvent } from '../../shared/types';
import type { EventLog } from '../../shared/entities/event-log.entity';

/**
 * EventContextService
 * Builds recent-events context for the agent (e.g. recentEvents list).
 */
export class EventContextService {
  constructor(private readonly repo: EventLogRepository) {}

  /**
   * Returns recent events as RecentEvent[] (one-line summaries, timeAgo).
   * Phase D may add compression (group consecutive tool_call by executionId).
   */
  async getRecentEvents(
    pageId: string,
    limit?: number
  ): Promise<RecentEvent[]> {
    const events = await this.repo.findRecentByPageId(
      pageId,
      limit ?? 15
    );

    return events.map(event => this.toRecentEvent(event));
  }

  private toRecentEvent(event: EventLog): RecentEvent {
    const actor =
      event.eventType.isUserUtterance()
        ? 'user'
        : event.eventType.isToolCall() || event.eventType.isAIResponse()
          ? 'agent'
          : 'system';
    const summary = event.getContentAsString().slice(0, 200);
    const timestamp = event.timestamp.toISOString();
    const timeAgo = formatTimeAgo(event.timestamp);
    const relatedBlockMountIds = this.extractBlockMountIds(event.metadata);

    return {
      type: event.eventType.value,
      actor,
      summary,
      timestamp,
      timeAgo,
      ...(relatedBlockMountIds.length > 0 && { relatedBlockMountIds }),
    };
  }

  private extractBlockMountIds(metadata?: Record<string, unknown>): string[] {
    if (!metadata) return [];
    const ids: string[] = [];
    if (Array.isArray(metadata.blockMountIds)) {
      ids.push(...metadata.blockMountIds.filter((x): x is string => typeof x === 'string'));
    }
    if (typeof metadata.blockMountId === 'string') {
      ids.push(metadata.blockMountId);
    }
    return [...new Set(ids)];
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString();
}
