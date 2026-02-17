import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { EventSearchService } from '../event-search.service';
import type { EventLogRepository } from '../../repositories/interfaces/event-log.repository.interface';
import { EventLog } from '../../../shared/entities/event-log.entity';
import { EventId } from '../../../shared/value-objects/event-id.vo';
import { EventType } from '../../../shared/value-objects/event-type.vo';
import { UtteranceContent } from '../../../shared/value-objects/utterance-content.vo';
import { EventManagementError } from '../../../shared/errors/event-management.error';
import { randomUUID } from 'crypto';

describe('EventSearchService', () => {
  let service: EventSearchService;
  let mockRepository: EventLogRepository;
  let pageId: string;

  beforeEach(() => {
    pageId = randomUUID();

    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findRecentByPageId: vi.fn(),
      recentContextForAgent: vi.fn(),
      findRecentByPageIdAndUserId: vi.fn(),
      findByBlockMountId: vi.fn(),
      findByFilters: vi.fn(),
      searchByBM25: vi.fn(),
      searchByMetadata: vi.fn(),
      searchHybrid: vi.fn(),
      countByType: vi.fn(),
      findByAgentExecutionId: vi.fn(),
    };

    service = new EventSearchService(mockRepository);
  });

  describe('searchLongTermMemory', () => {
    it('BM25 검색 전략으로 검색해야 한다', async () => {
      const mockEvents: EventLog[] = [
        new EventLog(
          new EventId(randomUUID()),
          new EventType('user_utterance'),
          new PageId(pageId),
          new UserId(randomUUID()),
          new Date(),
          new UtteranceContent('테스트 발화')
        ),
      ];

      vi.mocked(mockRepository.searchByBM25).mockResolvedValue(mockEvents);

      const result = await service.searchLongTermMemory(
        '테스트',
        pageId,
        10,
        7,
        'bm25'
      );

      expect(result.events).toHaveLength(1);
      expect(result.searchStrategy).toBe('bm25');
      expect(mockRepository.searchByBM25).toHaveBeenCalledWith(
        '테스트',
        pageId,
        10,
        7
      );
    });

    it('하이브리드 검색 전략으로 검색해야 한다', async () => {
      const mockEvents: EventLog[] = [];
      vi.mocked(mockRepository.searchHybrid).mockResolvedValue(mockEvents);

      const result = await service.searchLongTermMemory(
        '테스트',
        pageId,
        10,
        7,
        'hybrid'
      );

      expect(result.searchStrategy).toBe('hybrid');
      expect(mockRepository.searchHybrid).toHaveBeenCalled();
    });

    it('빈 쿼리 텍스트에 대해 예외를 발생시켜야 한다', async () => {
      await expect(
        service.searchLongTermMemory('', pageId, 10, 7, 'bm25')
      ).rejects.toThrow(EventManagementError);
    });

    it('잘못된 페이지 ID에 대해 예외를 발생시켜야 한다', async () => {
      await expect(
        service.searchLongTermMemory('test', 'invalid-uuid', 10, 7, 'bm25')
      ).rejects.toThrow(EventManagementError);
    });

    it('topK가 범위를 벗어나면 예외를 발생시켜야 한다', async () => {
      await expect(
        service.searchLongTermMemory('test', pageId, 0, 7, 'bm25')
      ).rejects.toThrow(EventManagementError);

      await expect(
        service.searchLongTermMemory('test', pageId, 101, 7, 'bm25')
      ).rejects.toThrow(EventManagementError);
    });

    it('timeWeightFactor가 범위를 벗어나면 예외를 발생시켜야 한다', async () => {
      await expect(
        service.searchLongTermMemory('test', pageId, 10, 0, 'bm25')
      ).rejects.toThrow(EventManagementError);

      await expect(
        service.searchLongTermMemory('test', pageId, 10, 366, 'bm25')
      ).rejects.toThrow(EventManagementError);
    });
  });

  describe('searchByBM25', () => {
    it('Repository의 searchByBM25를 호출해야 한다', async () => {
      const mockEvents: EventLog[] = [];
      vi.mocked(mockRepository.searchByBM25).mockResolvedValue(mockEvents);

      await service.searchByBM25('test', pageId, 10, 7);

      expect(mockRepository.searchByBM25).toHaveBeenCalledWith(
        'test',
        pageId,
        10,
        7
      );
    });
  });

  describe('searchByMetadata', () => {
    it('Repository의 searchByMetadata를 호출해야 한다', async () => {
      const filters = { toolName: 'addBlock' };
      const mockEvents: EventLog[] = [];
      vi.mocked(mockRepository.searchByMetadata).mockResolvedValue(mockEvents);

      await service.searchByMetadata(filters, pageId, 10, 7);

      expect(mockRepository.searchByMetadata).toHaveBeenCalledWith(
        filters,
        pageId,
        10,
        7
      );
    });
  });

  describe('searchHybrid', () => {
    it('Repository의 searchHybrid를 호출해야 한다', async () => {
      const filters = { toolName: 'addBlock' };
      const mockEvents: EventLog[] = [];
      vi.mocked(mockRepository.searchHybrid).mockResolvedValue(mockEvents);

      await service.searchHybrid('test', filters, pageId, 10, 7);

      expect(mockRepository.searchHybrid).toHaveBeenCalledWith(
        'test',
        filters,
        pageId,
        10,
        7
      );
    });
  });
});
