/**
 * Event Management Domain - Shared types
 */

/** Event actor (who triggered the event) */
export type EventActor =
  | { type: 'user'; userId: string }
  | { type: 'agent'; agentId?: string; executionId: string }
  | { type: 'system' };

/** Recent event item for dynamic context (recentEvents) */
export interface RecentEvent {
  type: string;
  actor: 'user' | 'agent' | 'system';
  summary: string;
  timestamp: string;
  timeAgo: string;
  relatedBlockMountIds?: string[];
}
