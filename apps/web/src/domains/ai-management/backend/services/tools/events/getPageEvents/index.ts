/**
 * getPageEvents Tool
 *
 * Schema + execution in one place.
 */

import { z } from 'zod';
import type { EventSearchService, EventLog } from '@/domains/event-management';

const getPageEventsArgsSchema = z.object({
  pageId: z.uuid().optional().describe('Page ID (default: current page)'),
  since: z.string().optional().describe('Start of range: "1d", "1w", or ISO date'),
  until: z.string().optional().describe('End of range: ISO date or relative'),
  eventTypes: z.array(z.string()).optional().describe('Filter by event types'),
  userId: z.string().uuid().optional().describe('Filter by user ID'),
  blockMountId: z.string().optional().describe('Filter to events related to this block'),
  groupByExecution: z.boolean().default(true).optional().describe('Group by agent execution'),
  limit: z.number().min(1).max(100).default(30).optional().describe('Max events (default: 30)'),
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

export function createGetPageEventsTool(
  eventSearchService: EventSearchService,
  pageId: string | undefined
) {
  return {
    description: `Get page activity history — time-ordered events (user messages, agent actions, tool calls).

Use when: "What happened on this page?", "Show recent activity", "What did we do yesterday?", "History for this block."

- since/until: "1d", "1w", or ISO date string.
- eventTypes: filter by type (e.g. ["user_utterance", "tool_call", "ai_response"]).
- userId: filter by user.
- blockMountId: filter to events related to this block.
- groupByExecution: group events by agent execution (default: true).`,
    inputSchema: getPageEventsArgsSchema,
    execute: async (args: z.infer<typeof getPageEventsArgsSchema>) => {
      const pid = args.pageId ?? pageId;
      if (!pid) return { events: [], groups: [] };
      const res = await eventSearchService.getPageEvents({ ...args, pageId: pid });
      return {
        events: res.events.map((e: EventLog) => toSummary(e)),
        groups: res.groups?.map(g => ({
          executionId: g.executionId,
          events: g.events.map((e: EventLog) => toSummary(e)),
        })),
      };
    },
  };
}
