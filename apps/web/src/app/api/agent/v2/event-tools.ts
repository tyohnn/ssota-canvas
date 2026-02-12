import type { EventSearchService, EventLog } from '@/domains/event-management';
import { getPageEventsTool, grepEventsTool } from './tools';

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
    ...getPageEventsTool,
    execute: async (args: { pageId?: string; [key: string]: unknown }) => {
      const pid = args.pageId ?? pageId;
      if (!pid) return { events: [], groups: [] };
      const res = await eventSearchService.getPageEvents({ ...args, pageId: pid });
      return {
        events: res.events.map((e: EventLog) => toSummary(e)),
        groups: res.groups?.map((g) => ({
          executionId: g.executionId,
          events: g.events.map((e: EventLog) => toSummary(e)),
        })),
      };
    },
  };
}

type GrepEventsParams = Parameters<EventSearchService['grepEvents']>[0];

export function createGrepEventsTool(
  eventSearchService: EventSearchService,
  pageId: string | undefined
) {
  return {
    ...grepEventsTool,
    execute: async (args: Omit<GrepEventsParams, 'pageId'> & { pageId?: string }) => {
      const pid = args.pageId ?? pageId;
      if (!pid) return [];
      const params = { ...args, pageId: pid } as GrepEventsParams;
      const events = await eventSearchService.grepEvents(params);
      return events.map((e: EventLog) => toSummary(e));
    },
  };
}
