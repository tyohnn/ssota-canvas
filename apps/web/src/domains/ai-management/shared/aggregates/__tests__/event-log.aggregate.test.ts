import { describe, it, expect, beforeEach } from 'vitest';
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
import { AIManagementError } from '../../errors/ai-management.error';

describe('EventLogAggregate', () => {
  let aggregate: EventLogAggregate;
  let pageId: string;
  let userId: string;

  beforeEach(() => {
    aggregate = new EventLogAggregate();
    pageId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    userId = 'b1ffcd88-8d1a-4ef9-cc7e-7cc0ce491b22';
  });

  describe('logUserUtterance', () => {
    it('사용자 발화를 로깅하고 UserUtteranceLoggedEvent를 발행해야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: '이 코드를 리팩터해줘',
        pageId,
        userId,
        selectedBlockIds: ['block-1', 'block-2'],
        nearbyBlockIds: ['block-3'],
      };

      // When
      const events = aggregate.logUserUtterance(command);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserUtteranceLoggedEvent);
      
      const event = events[0] as UserUtteranceLoggedEvent;
      expect(event.utterance).toBe(command.utterance);
      expect(event.pageId).toBe(pageId);
      expect(event.userId).toBe(userId);
      expect(event.selectedBlockIds).toEqual(['block-1', 'block-2']);
      expect(event.nearbyBlockIds).toEqual(['block-3']);
    });

    it('빈 발화에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: '',
        pageId,
        userId,
      };

      // When & Then
      expect(() => aggregate.logUserUtterance(command)).toThrow(AIManagementError);
    });

    it('공백만 있는 발화에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: '   ',
        pageId,
        userId,
      };

      // When & Then
      expect(() => aggregate.logUserUtterance(command)).toThrow(AIManagementError);
    });

    it('잘못된 페이지 ID에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: 'Hello',
        pageId: 'invalid-uuid',
        userId,
      };

      // When & Then
      expect(() => aggregate.logUserUtterance(command)).toThrow(AIManagementError);
    });
  });

  describe('logAIResponse', () => {
    it('AI 응답을 로깅하고 AIResponseLoggedEvent를 발행해야 한다', () => {
      // Given
      const relatedUtteranceEventId = 'c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33';
      const command: LogAIResponseCommand = {
        response: '코드를 리팩터링했습니다.',
        pageId,
        userId,
        relatedUtteranceEventId,
        agentLoopCount: 3,
        model: 'gpt-4o',
        tokens: 150,
      };

      // When
      const events = aggregate.logAIResponse(command);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AIResponseLoggedEvent);
      
      const event = events[0] as AIResponseLoggedEvent;
      expect(event.response).toBe(command.response);
      expect(event.pageId).toBe(pageId);
      expect(event.userId).toBe(userId);
      expect(event.relatedUtteranceEventId).toBe(relatedUtteranceEventId);
      expect(event.agentLoopCount).toBe(3);
      expect(event.model).toBe('gpt-4o');
      expect(event.tokens).toBe(150);
    });

    it('빈 응답에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogAIResponseCommand = {
        response: '',
        pageId,
        userId,
        relatedUtteranceEventId: 'c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33',
        agentLoopCount: 1,
      };

      // When & Then
      expect(() => aggregate.logAIResponse(command)).toThrow(AIManagementError);
    });

    it('잘못된 Agent Loop 횟수에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogAIResponseCommand = {
        response: 'Response',
        pageId,
        userId,
        relatedUtteranceEventId: 'c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33',
        agentLoopCount: 0, // 0은 유효하지 않음
      };

      // When & Then
      expect(() => aggregate.logAIResponse(command)).toThrow(AIManagementError);
    });

    it('Agent Loop 최대 횟수를 초과하면 예외를 발생시켜야 한다', () => {
      // Given
      const command: LogAIResponseCommand = {
        response: 'Response',
        pageId,
        userId,
        relatedUtteranceEventId: 'c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33',
        agentLoopCount: 11, // 최대 10회
      };

      // When & Then
      expect(() => aggregate.logAIResponse(command)).toThrow(AIManagementError);
    });
  });

  describe('logToolCall', () => {
    it('툴 호출을 로깅하고 ToolCallLoggedEvent를 발행해야 한다', () => {
      // Given
      const command: LogToolCallCommand = {
        toolName: 'addBlock',
        params: { blockType: 'markdown', content: 'Hello' },
        result: { success: true, blockId: 'block-123' },
        pageId,
        userId,
        agentExecutionId: 'agent-exec-1',
        executionTime: 150,
        success: true,
      };

      // When
      const events = aggregate.logToolCall(command);

      // Then
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

    it('실패한 툴 호출도 로깅해야 한다', () => {
      // Given
      const command: LogToolCallCommand = {
        toolName: 'deleteBlock',
        params: { blockId: 'block-123' },
        result: { success: false },
        pageId,
        userId,
        agentExecutionId: 'agent-exec-1',
        executionTime: 50,
        success: false,
        errorMessage: 'Block not found',
      };

      // When
      const events = aggregate.logToolCall(command);

      // Then
      expect(events).toHaveLength(1);
      
      const event = events[0] as ToolCallLoggedEvent;
      expect(event.success).toBe(false);
      expect(event.errorMessage).toBe('Block not found');
    });
  });

  describe('logBlockCreated', () => {
    it('블럭 생성을 로깅하고 BlockCreatedLoggedEvent를 발행해야 한다', () => {
      // Given
      const command: LogBlockCreatedCommand = {
        blockId: 'd3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22',
        blockType: 'markdown',
        pageId,
        userId,
        properties: { title: '새 블럭', content: 'Hello' },
        agentExecutionId: 'agent-exec-1',
      };

      // When
      const events = aggregate.logBlockCreated(command);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockCreatedLoggedEvent);
      
      const event = events[0] as BlockCreatedLoggedEvent;
      expect(event.blockId).toBe('d3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22');
      expect(event.blockType).toBe('markdown');
      expect(event.properties).toEqual(command.properties);
      expect(event.agentExecutionId).toBe('agent-exec-1');
    });
  });

  describe('logBlockUpdated', () => {
    it('블럭 수정을 로깅하고 BlockUpdatedLoggedEvent를 발행해야 한다', () => {
      // Given
      const command: LogBlockUpdatedCommand = {
        blockId: 'd3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22',
        pageId,
        userId,
        changes: { title: '수정된 블럭' },
        agentExecutionId: 'agent-exec-1',
      };

      // When
      const events = aggregate.logBlockUpdated(command);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockUpdatedLoggedEvent);
      
      const event = events[0] as BlockUpdatedLoggedEvent;
      expect(event.blockId).toBe('d3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22');
      expect(event.changes).toEqual(command.changes);
      expect(event.agentExecutionId).toBe('agent-exec-1');
    });
  });

  describe('logBlockDeleted', () => {
    it('블럭 삭제를 로깅하고 BlockDeletedLoggedEvent를 발행해야 한다', () => {
      // Given
      const command: LogBlockDeletedCommand = {
        blockId: 'd3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22',
        pageId,
        userId,
        agentExecutionId: 'agent-exec-1',
      };

      // When
      const events = aggregate.logBlockDeleted(command);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockDeletedLoggedEvent);
      
      const event = events[0] as BlockDeletedLoggedEvent;
      expect(event.blockId).toBe('d3aabc99-8c1b-4ef8-cc6d-7cc9cd490b22');
      expect(event.agentExecutionId).toBe('agent-exec-1');
    });
  });

  describe('getUncommittedEvents', () => {
    it('커밋되지 않은 이벤트들을 반환해야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: 'Hello',
        pageId,
        userId,
      };
      aggregate.logUserUtterance(command);

      // When
      const uncommittedEvents = aggregate.getUncommittedEvents();

      // Then
      expect(uncommittedEvents).toHaveLength(1);
      expect(uncommittedEvents[0]?.type).toBe('UserUtteranceLogged');
    });

    it('여러 이벤트를 추적해야 한다', () => {
      // Given
      const utteranceCommand: LogUserUtteranceCommand = {
        utterance: 'Hello',
        pageId,
        userId,
      };
      const responseCommand: LogAIResponseCommand = {
        response: 'Hi there',
        pageId,
        userId,
        relatedUtteranceEventId: 'c2ffed99-7e2b-4ef0-ad8f-8dd1df502c33',
        agentLoopCount: 1,
      };

      aggregate.logUserUtterance(utteranceCommand);
      aggregate.logAIResponse(responseCommand);

      // When
      const uncommittedEvents = aggregate.getUncommittedEvents();

      // Then
      expect(uncommittedEvents).toHaveLength(2);
    });
  });

  describe('markEventsAsCommitted', () => {
    it('이벤트를 커밋 완료로 표시해야 한다', () => {
      // Given
      const command: LogUserUtteranceCommand = {
        utterance: 'Hello',
        pageId,
        userId,
      };
      aggregate.logUserUtterance(command);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      // When
      aggregate.markEventsAsCommitted();

      // Then
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});

