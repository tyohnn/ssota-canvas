import { describe, it, expect, beforeEach } from 'vitest';
import { EventLog } from '../event-log.entity';
import { EventId } from '../../value-objects/event-id.vo';
import { EventType } from '../../value-objects/event-type.vo';
import { UtteranceContent } from '../../value-objects/utterance-content.vo';
import { AIResponse } from '../../value-objects/ai-response.vo';
import { ToolCallResult } from '../../value-objects/tool-call-result.vo';

describe('EventLog Entity', () => {
  let eventId: EventId;
  let pageId: string;
  let userId: string;
  let timestamp: Date;

  beforeEach(() => {
    eventId = new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    pageId = 'page-123';
    userId = 'user-456';
    timestamp = new Date('2025-11-12T10:00:00Z');
  });

  describe('사용자 발화 이벤트 생성', () => {
    it('사용자 발화 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('이 코드를 리팩터해줘');
      const metadata = { source: 'chat-ui' };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        content,
        metadata
      );

      // Then
      expect(eventLog.id).toBe(eventId);
      expect(eventLog.eventType).toBe(eventType);
      expect(eventLog.pageId).toBe(pageId);
      expect(eventLog.userId).toBe(userId);
      expect(eventLog.timestamp).toBe(timestamp);
      expect(eventLog.content).toBe(content);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('AI 응답 이벤트 생성', () => {
    it('AI 응답 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('ai_response');
      const response = new AIResponse('코드를 리팩터링했습니다.');
      const metadata = { model: 'gpt-4o', tokens: 150 };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        response,
        metadata
      );

      // Then
      expect(eventLog.eventType.isAIResponse()).toBe(true);
      expect(eventLog.content).toBe(response);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('툴 호출 이벤트 생성', () => {
    it('툴 호출 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('tool_call');
      const toolResult = new ToolCallResult(JSON.stringify({ 
        success: true, 
        toolName: 'addBlock',
        blockId: 'block-789' 
      }));
      const metadata = { toolName: 'addBlock', duration: 120 };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        toolResult,
        metadata
      );

      // Then
      expect(eventLog.eventType.isToolCall()).toBe(true);
      expect(eventLog.content).toBe(toolResult);
      expect(eventLog.metadata).toEqual(metadata);
    });
  });

  describe('블럭 생성 이벤트', () => {
    it('블럭 생성 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('block_created');
      const changeData = new ToolCallResult(JSON.stringify({
        blockId: 'block-789',
        blockType: 'markdown',
        properties: { title: '새 블럭' }
      }));
      const metadata = { blockType: 'markdown' };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        changeData,
        metadata
      );

      // Then
      expect(eventLog.eventType.isBlockCreated()).toBe(true);
      expect(eventLog.eventType.isBlockChange()).toBe(true);
      expect(eventLog.content).toBe(changeData);
    });
  });

  describe('블럭 수정 이벤트', () => {
    it('블럭 수정 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('block_updated');
      const changeData = new ToolCallResult(JSON.stringify({
        blockId: 'block-789',
        changes: { title: '수정된 블럭' }
      }));
      const metadata = { blockType: 'markdown' };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        changeData,
        metadata
      );

      // Then
      expect(eventLog.eventType.isBlockUpdated()).toBe(true);
      expect(eventLog.eventType.isBlockChange()).toBe(true);
      expect(eventLog.content).toBe(changeData);
    });
  });

  describe('블럭 삭제 이벤트', () => {
    it('블럭 삭제 이벤트로 생성되어야 한다', () => {
      // Given
      const eventType = new EventType('block_deleted');
      const changeData = new ToolCallResult(JSON.stringify({
        blockId: 'block-789'
      }));
      const metadata = { blockType: 'markdown' };

      // When
      const eventLog = new EventLog(
        eventId,
        eventType,
        pageId,
        userId,
        timestamp,
        changeData,
        metadata
      );

      // Then
      expect(eventLog.eventType.isBlockDeleted()).toBe(true);
      expect(eventLog.eventType.isBlockChange()).toBe(true);
      expect(eventLog.content).toBe(changeData);
    });
  });

  describe('getContentAsString', () => {
    it('UtteranceContent를 문자열로 반환해야 한다', () => {
      // Given
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Hello');
      const eventLog = new EventLog(eventId, eventType, pageId, userId, timestamp, content);

      // When
      const result = eventLog.getContentAsString();

      // Then
      expect(result).toBe('Hello');
    });

    it('AIResponse를 문자열로 반환해야 한다', () => {
      // Given
      const eventType = new EventType('ai_response');
      const response = new AIResponse('Response text');
      const eventLog = new EventLog(eventId, eventType, pageId, userId, timestamp, response);

      // When
      const result = eventLog.getContentAsString();

      // Then
      expect(result).toBe('Response text');
    });

    it('ToolCallResult를 문자열로 반환해야 한다', () => {
      // Given
      const eventType = new EventType('tool_call');
      const toolResult = new ToolCallResult(JSON.stringify({ success: true }));
      const eventLog = new EventLog(eventId, eventType, pageId, userId, timestamp, toolResult);

      // When
      const result = eventLog.getContentAsString();

      // Then
      expect(result).toBe(JSON.stringify({ success: true }));
    });
  });

  describe('isOlderThan', () => {
    it('지정된 시간보다 오래된 이벤트는 true를 반환해야 한다', () => {
      // Given
      const oldTimestamp = new Date('2025-01-01T00:00:00Z');
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Test');
      const eventLog = new EventLog(eventId, eventType, pageId, userId, oldTimestamp, content);

      // When
      const result = eventLog.isOlderThan(100); // 100일보다 오래됨

      // Then
      expect(result).toBe(true);
    });

    it('지정된 시간보다 최근 이벤트는 false를 반환해야 한다', () => {
      // Given
      const recentTimestamp = new Date(); // 현재 시간
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('Test');
      const eventLog = new EventLog(eventId, eventType, pageId, userId, recentTimestamp, content);

      // When
      const result = eventLog.isOlderThan(1); // 1일보다 오래됨

      // Then
      expect(result).toBe(false);
    });
  });
});

