import { describe, it, expect, beforeEach } from 'vitest';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzleEventLogRepository } from '../drizzle-event-log.repository';
import { EventLog } from '../../../../shared/entities/event-log.entity';
import { EventId } from '../../../../shared/value-objects/event-id.vo';
import { EventType } from '../../../../shared/value-objects/event-type.vo';
import { UtteranceContent } from '../../../../shared/value-objects/utterance-content.vo';
import { AIResponse } from '../../../../shared/value-objects/ai-response.vo';
import { randomUUID } from 'crypto';

/**
 * DrizzleEventLogRepository 통합 테스트
 * 실제 DB 사용 시 스킵 해제. 테스트용 페이지/사용자 UUID 필요.
 */
describe.skip('DrizzleEventLogRepository Integration Tests', () => {
  let repository: DrizzleEventLogRepository;
  let testPageId: PageId;
  let testUserId: UserId;

  beforeEach(() => {
    repository = new DrizzleEventLogRepository();
    testPageId = new PageId(randomUUID());
    testUserId = new UserId(randomUUID());
  });

  describe('save and findById', () => {
    it('사용자 발화 이벤트를 저장하고 조회해야 한다', async () => {
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

      await repository.save(eventLog);
      const found = await repository.findById(eventId);

      expect(found).not.toBeNull();
      expect(found?.id.value).toBe(eventId.value);
      expect(found?.eventType.value).toBe('user_utterance');
    }, 10000);
  });
});
