import { describe, it, expect, beforeEach } from 'vitest';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { EventLog } from '../event-log.entity';
import { EventId } from '../../value-objects/event-id.vo';
import { EventType } from '../../value-objects/event-type.vo';
import { UtteranceContent } from '../../value-objects/utterance-content.vo';
import { AIResponse } from '../../value-objects/ai-response.vo';
import { ToolCallResult } from '../../value-objects/tool-call-result.vo';

describe('EventLog Entity', () => {
  let eventId: EventId;
  let pageId: PageId;
  let userId: UserId;
  let timestamp: Date;

  beforeEach(() => {
    eventId = new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    pageId = new PageId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    userId = new UserId('b1ffcd88-8d1a-4ef9-cc7e-7cc0ce491b22');
    timestamp = new Date('2025-11-12T10:00:00Z');
  });

  describe('사용자 발화 이벤트 생성', () => {
    it('사용자 발화 이벤트로 생성되어야 한다', () => {
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('이 코드를 리팩터해줘');
      const metadata = { source: 'chat-ui' };

      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        content,
        metadata
      );

      expect(eventLog.id).toBe(eventId);
      expect(eventLog.eventType).toBe(eventType);
      expect(eventLog.pageId.value).toBe(pageId.value);
      expect(eventLog.userId.value).toBe(userId.value);
      expect(eventLog.timestamp).toBe(timestamp);
      expect(eventLog.content).toBe(content);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('AI 응답 이벤트 생성', () => {
    it('AI 응답 이벤트로 생성되어야 한다', () => {
      const eventType = new EventType('ai_response');
      const response = new AIResponse('코드를 리팩터링했습니다.');
      const metadata = { model: 'gpt-4o', tokens: 150 };

      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        response,
        metadata
      );

      expect(eventLog.eventType.isAIResponse()).toBe(true);
      expect(eventLog.content).toBe(response);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('툴 호출 이벤트 생성', () => {
    it('툴 호출 이벤트로 생성되어야 한다', () => {
      const eventType = new EventType('tool_call');
      const toolResult = new ToolCallResult(
        JSON.stringify({
          success: true,
          toolName: 'addBlock',
          blockId: 'block-789',
        })
      );
      const metadata = { toolName: 'addBlock', duration: 120 };

      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        toolResult,
        metadata
      );

      expect(eventLog.eventType.isToolCall()).toBe(true);
      expect(eventLog.content).toBe(toolResult);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('블럭 생성 이벤트', () => {
    it('블럭 생성 이벤트로 생성되어야 한다', () => {
      const eventType = new EventType('block_created');
      const changeData = new ToolCallResult(
        JSON.stringify({
          blockId: 'block-789',
          blockType: 'markdown',
          properties: { title: '새 블럭' },
        })
      );
      const metadata = { blockType: 'markdown' };

      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        changeData,
        metadata
      );

      expect(eventLog.eventType.isBlockCreated()).toBe(true);
      expect(eventLog.eventType.isBlockChange()).toBe(true);
      expect(eventLog.content).toBe(changeData);
    });
  });

  describe('getContentAsString', () => {
    it('UtteranceContent를 문자열로 반환해야 한다', () => {
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Hello');
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        content
      );
      expect(eventLog.getContentAsString()).toBe('Hello');
    });

    it('AIResponse를 문자열로 반환해야 한다', () => {
      const eventType = new EventType('ai_response');
      const response = new AIResponse('Response text');
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        response
      );
      expect(eventLog.getContentAsString()).toBe('Response text');
    });

    it('ToolCallResult를 문자열로 반환해야 한다', () => {
      const eventType = new EventType('tool_call');
      const toolResult = new ToolCallResult(JSON.stringify({ success: true }));
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        toolResult
      );
      expect(eventLog.getContentAsString()).toBe(
        JSON.stringify({ success: true })
      );
    });
  });

  describe('isOlderThan', () => {
    it('지정된 시간보다 오래된 이벤트는 true를 반환해야 한다', () => {
      const oldTimestamp = new Date('2025-01-01T00:00:00Z');
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Test');
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        oldTimestamp,
        content
      );
      expect(eventLog.isOlderThan(100)).toBe(true);
    });

    it('지정된 시간보다 최근 이벤트는 false를 반환해야 한다', () => {
      const recentTimestamp = new Date();
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Test');
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        recentTimestamp,
        content
      );
      expect(eventLog.isOlderThan(1)).toBe(false);
    });
  });
});
