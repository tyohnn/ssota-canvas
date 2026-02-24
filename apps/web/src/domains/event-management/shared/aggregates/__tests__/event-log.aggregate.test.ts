import { describe, it, expect, beforeEach } from 'vitest';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { AgentExecutionId } from '../../value-objects/agent-execution-id.vo';
import { EventId } from '../../value-objects/event-id.vo';
import { EventLogAggregate } from '../event-log.aggregate';
import {
  LogUserUtteranceCommand,
  LogAIResponseCommand,
  LogToolCallCommand,
  LogBlockCreatedCommand,
  LogBlockUpdatedCommand,
  LogBlockDeletedCommand,
} from '../../commands';
import {
  UserUtteranceLoggedEvent,
  AIResponseLoggedEvent,
  ToolCallLoggedEvent,
  BlockCreatedLoggedEvent,
  BlockUpdatedLoggedEvent,
  BlockDeletedLoggedEvent,
} from '../../events';
import { EventManagementError } from '../../errors/event-management.error';

describe('EventLogAggregate', () => {
  let aggregate: EventLogAggregate;
  let pageId: PageId;
  let userId: UserId;

  beforeEach(() => {
    aggregate = new EventLogAggregate();
    pageId = new PageId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    userId = new UserId('b1ffcd88-8d1a-4ef9-cc7e-7cc0ce491b22');
  });

  describe('logUserUtterance', () => {
    it('사용자 발화를 로깅하고 UserUtteranceLoggedEvent를 발행해야 한다', () => {
      const command: LogUserUtteranceCommand = {
        utterance: '이 코드를 리팩터해줘',
        pageId,
        userId,
        selectedBlockIds: ['block-1', 'block-2'],
        nearbyBlockIds: ['block-3'],
      };

      aggregate.logUserUtterance(command);
      const events = aggregate.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserUtteranceLoggedEvent);
      const event = events[0] as UserUtteranceLoggedEvent;
      expect(event.utterance).toBe(command.utterance);
      expect(event.pageId).toBe(pageId.value);
      expect(event.userId).toBe(userId.value);
      expect(event.selectedBlockIds).toEqual(['block-1', 'block-2']);
      expect(event.nearbyBlockIds).toEqual(['block-3']);
    });

    it('빈 발화에 대해 예외를 발생시켜야 한다', () => {
      const command: LogUserUtteranceCommand = {
        utterance: '',
        pageId,
        userId,
      };
      expect(() => aggregate.logUserUtterance(command)).toThrow(
        EventManagementError
      );
    });

    it('공백만 있는 발화에 대해 예외를 발생시켜야 한다', () => {
      const command: LogUserUtteranceCommand = {
        utterance: '   ',
        pageId,
        userId,
      };
      expect(() => aggregate.logUserUtterance(command)).toThrow(
        EventManagementError
      );
    });

    it('잘못된 페이지 ID는 PageId 생성 시 예외를 발생시켜야 한다', () => {
      expect(() => new PageId('invalid-uuid')).toThrow();
    });
  });

  describe('logAIResponse', () => {
    it('AI 응답을 로깅하고 AIResponseLoggedEvent를 발행해야 한다', () => {
      const relatedUtteranceEventId = new EventId('c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33');
      const command: LogAIResponseCommand = {
        response: '코드를 리팩터링했습니다.',
        pageId,
        userId,
        relatedUtteranceEventId,
        agentLoopCount: 1,
      };

      aggregate.logAIResponse(command);
      const events = aggregate.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AIResponseLoggedEvent);
      const event = events[0] as AIResponseLoggedEvent;
      expect(event.response).toBe(command.response);
      expect(event.relatedUtteranceEventId).toBe(relatedUtteranceEventId.value);
      expect(event.agentLoopCount).toBe(1);
    });

    it('agent loop count가 범위를 벗어나면 예외를 발생시켜야 한다', () => {
      const command: LogAIResponseCommand = {
        response: 'Hi',
        pageId,
        userId,
        relatedUtteranceEventId: new EventId('c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33'),
        agentLoopCount: 0,
      };
      expect(() => aggregate.logAIResponse(command)).toThrow(
        EventManagementError
      );
    });
  });

  describe('logToolCall', () => {
    it('툴 호출을 로깅하고 ToolCallLoggedEvent를 발행해야 한다', () => {
      const command: LogToolCallCommand = {
        toolName: 'addBlock',
        params: { blockType: 'markdown', content: 'Hello' },
        result: { success: true, blockId: 'block-123' },
        pageId,
        userId,
        agentExecutionId: new AgentExecutionId('agent-exec-1'),
        executionTime: 150,
        success: true,
      };

      aggregate.logToolCall(command);
      const events = aggregate.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ToolCallLoggedEvent);
      const event = events[0] as ToolCallLoggedEvent;
      expect(event.toolName).toBe('addBlock');
      expect(event.params).toEqual(command.params);
      expect(event.result).toEqual(command.result);
      expect(event.executionTime).toBe(150);
      expect(event.agentExecutionId).toBe('agent-exec-1');
      expect(event.success).toBe(true);
    });

    it('V2 도구 이름(grepBlockContent 등)도 로깅해야 한다', () => {
      const command: LogToolCallCommand = {
        toolName: 'grepBlockContent',
        params: { query: 'foo' },
        result: { matches: [] },
        pageId,
        userId,
        agentExecutionId: new AgentExecutionId('exec-1'),
        executionTime: 10,
        success: true,
      };
      aggregate.logToolCall(command);
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as ToolCallLoggedEvent).toolName).toBe('grepBlockContent');
    });

    it('빈 툴 이름에 대해 예외를 발생시켜야 한다', () => {
      const command: LogToolCallCommand = {
        toolName: '',
        params: {},
        result: {},
        pageId,
        userId,
        agentExecutionId: new AgentExecutionId('exec-1'),
        executionTime: 0,
        success: true,
      };
      expect(() => aggregate.logToolCall(command)).toThrow(
        EventManagementError
      );
    });
  });

  describe('logBlockCreated', () => {
    it('블럭 생성을 로깅하고 BlockCreatedLoggedEvent를 발행해야 한다', () => {
      const command: LogBlockCreatedCommand = {
        blockId: 'd3aabc99',
        blockType: 'markdown',
        pageId,
        userId,
        properties: { title: '새 블럭', content: 'Hello' },
        agentExecutionId: new AgentExecutionId('agent-exec-1'),
      };

      aggregate.logBlockCreated(command);
      const events = aggregate.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockCreatedLoggedEvent);
      const event = events[0] as BlockCreatedLoggedEvent;
      expect(event.blockId).toBe('d3aabc99');
      expect(event.blockType).toBe('markdown');
      expect(event.properties).toEqual(command.properties);
      expect(event.agentExecutionId).toBe('agent-exec-1');
    });
  });

  describe('getUncommittedEvents', () => {
    it('커밋되지 않은 이벤트들을 반환해야 한다', () => {
      aggregate.logUserUtterance({
        utterance: 'Hello',
        pageId,
        userId,
      });
      const uncommittedEvents = aggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(1);
      expect(uncommittedEvents[0]?.type).toBe('UserUtteranceLogged');
    });
  });

  describe('markEventsAsCommitted', () => {
    it('이벤트를 커밋 완료로 표시해야 한다', () => {
      aggregate.logUserUtterance({
        utterance: 'Hello',
        pageId,
        userId,
      });
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      aggregate.markEventsAsCommitted();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
