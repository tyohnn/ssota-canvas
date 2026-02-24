/**
 * grepEvents Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { EventSearchService, EventLog } from '@/domains/event-management';

type GrepEventsParams = Parameters<EventSearchService['grepEvents']>[0];

const grepEventsArgsSchema = z.object({
  query: z.string().describe('Search query (keywords)'),
  pageId: z.uuid().optional().describe('Page ID (default: current page)'),
  eventTypes: z.array(z.string()).optional().describe('Filter by event types'),
  actor: z.enum(['user', 'agent', 'system', 'all']).default('all').optional().describe('Filter by actor'),
  userId: z.string().uuid().optional().describe('Filter by user ID'),
  blockMountId: z.string().optional().describe('Filter to events related to this block'),
  since: z.string().optional().describe('"1d", "1w", or ISO date'),
  limit: z.number().min(1).max(50).default(20).optional().describe('Max results (default: 20)'),
});

type EventSummary = {
  id: string;
  type: string;
  timestamp: string;
  content: string;
  agentExecutionId?: string;
};

function toSummary(
  e: {
    id: { value: string };
    eventType: { value: string };
    timestamp: Date;
    getContentAsString: () => string;
    agentExecutionId?: string;
  }
): EventSummary {
  return {
    id: e.id.value,
    type: e.eventType.value,
    timestamp: e.timestamp.toISOString(),
    content: e.getContentAsString().slice(0, 300),
    agentExecutionId: e.agentExecutionId,
  };
}

export function createGrepEventsTool(
  eventSearchService: EventSearchService,
  pageId: string | undefined
) {
  return {
    description: `Search events by keyword (BM25). Use for "Who said X?", "Find when we discussed Y", "Events containing Z."

Same filters as getPageEvents: eventTypes, actor (user/agent/system), userId, blockMountId, since.`,
    inputSchema: grepEventsArgsSchema,
    execute: async (args: Omit<z.infer<typeof grepEventsArgsSchema>, 'pageId'> & { pageId?: string }) => {
      const pid = args.pageId ?? pageId;
      if (!pid) return [];
      const params = { ...args, pageId: pid } as GrepEventsParams;
      const events = await eventSearchService.grepEvents(params);
      return events.map((e: EventLog) => toSummary(e));
    },
  };
}
