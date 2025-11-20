import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleEventLogRepository } from '../drizzle-event-log.repository';
import { EventLog } from '../../../../shared/entities/event-log.entity';
import { EventId } from '../../../../shared/value-objects/event-id.vo';
import { EventType } from '../../../../shared/value-objects/event-type.vo';
import { UtteranceContent } from '../../../../shared/value-objects/utterance-content.vo';
import { AIResponse } from '../../../../shared/value-objects/ai-response.vo';
import { ToolCallResult } from '../../../../shared/value-objects/tool-call-result.vo';
import { randomUUID } from 'crypto';

/**
 * DrizzleEventLogRepository 통합 테스트
 * 
 * ⚠️ 주의사항:
 * 1. 실제 DB를 사용하므로 기존 데이터를 절대 삭제하지 않음
 * 2. 테스트용 데이터는 test-event- prefix 사용
 * 3. 테스트 데이터는 정리하지 않음 (Append-Only Audit Log)
 * 4. 실제 페이지와 사용자 UUID가 필요하므로 일단 스킵
 * 
 * TODO: 실제 DB에 테스트용 페이지/사용자를 생성하고 테스트 활성화
 */
describe.skip('DrizzleEventLogRepository Integration Tests', () => {
  let repository: DrizzleEventLogRepository;
  let testPageId: string;
  let testUserId: string;

  beforeEach(() => {
    repository = new DrizzleEventLogRepository();
    // 테스트용 고유 ID 생성 (실제 페이지/사용자와 구분)
    testPageId = `test-page-${Date.now()}-${randomUUID()}`;
    testUserId = `test-user-${Date.now()}-${randomUUID()}`;
  });

  describe('save and findById', () => {
    it('사용자 발화 이벤트를 저장하고 조회해야 한다', async () => {
      // Given
      const eventId = new EventId(randomUUID());
      const eventType = new EventType('user_utterance');
      const content = new UtteranceContent('테스트 발화입니다');
      const metadata = { source: 'test' };

      const eventLog = new EventLog(
        eventId,
        eventType,
        testPageId,
        testUserId,
        new Date(),
        content,
        metadata
      );

      // When
      await repository.save(eventLog);
      const found = await repository.findById(eventId);

      // Then
      expect(found).not.toBeNull();
      expect(found?.id.value).toBe(eventId.value);
      expect(found?.eventType.value).toBe('user_utterance');
      expect(found?.pageId).toBe(testPageId);
      expect(found?.userId).toBe(testUserId);
    }, 10000); // 10초 타임아웃
  });

  describe('findRecentByPageId', () => {
    it('페이지별 최근 이벤트를 조회해야 한다', async () => {
      // Given: 3개의 이벤트 생성
      const events: EventLog[] = [];
      
      for (let i = 0; i < 3; i++) {
        const eventId = new EventId(randomUUID());
        const eventType = new EventType('user_utterance');
        const content = new UtteranceContent(`테스트 발화 ${i}`);

        const eventLog = new EventLog(
          eventId,
          eventType,
          testPageId,
          testUserId,
          new Date(Date.now() + i * 1000), // 시간차를 두고 생성
          content
        );

        events.push(eventLog);
        await repository.save(eventLog);
        
        // 시간차를 두기 위한 대기
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // When
      const recent = await repository.findRecentByPageId(testPageId, 5);

      // Then
      expect(recent.length).toBeGreaterThanOrEqual(3);
      
      // 최신 순으로 정렬되어 있는지 확인
      for (let i = 0; i < recent.length - 1; i++) {
        const current = recent[i];
        const next = recent[i + 1];
        if (current && next) {
          expect(current.timestamp.getTime()).toBeGreaterThanOrEqual(
            next.timestamp.getTime()
          );
        }
      }
    }, 15000);
  });

  describe('countByType', () => {
    it('이벤트 타입별 개수를 조회해야 한다', async () => {
      // Given: 여러 타입의 이벤트 생성
      const utteranceEvent = new EventLog(
        new EventId(randomUUID()),
        new EventType('user_utterance'),
        testPageId,
        testUserId,
        new Date(),
        new UtteranceContent('발화 1')
      );

      const responseEvent = new EventLog(
        new EventId(randomUUID()),
        new EventType('ai_response'),
        testPageId,
        testUserId,
        new Date(),
        new AIResponse('응답 1')
      );

      await repository.save(utteranceEvent);
      await repository.save(responseEvent);

      // When
      const counts = await repository.countByType(testPageId);

      // Then
      expect(counts.size).toBeGreaterThan(0);
      expect(counts.get('user_utterance')).toBeGreaterThanOrEqual(1);
      expect(counts.get('ai_response')).toBeGreaterThanOrEqual(1);
    }, 10000);
  });
});

