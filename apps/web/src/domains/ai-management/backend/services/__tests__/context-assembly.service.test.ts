import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ContextAssemblyService } from '../context-assembly.service';
import {
  EventLogRepository,
  EventSearchService,
  EventLog,
  EventId,
  EventType,
  UtteranceContent,
} from '@/domains/event-management';
import { AIManagementError } from '../../../shared/errors/ai-management.error';
import { randomUUID } from 'crypto';

/**
 * ContextAssemblyService 단위 테스트
 * Repository와 MemorySearchService를 Mock하여 테스트
 */
describe('ContextAssemblyService', () => {
  let service: ContextAssemblyService;
  let mockEventLogRepository: EventLogRepository;
  let mockEventSearchService: EventSearchService;
  let pageId: string;
  let userId: string;

  beforeEach(() => {
    pageId = randomUUID();
    userId = randomUUID();

    // Mock Repository
    mockEventLogRepository = {
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

    // Mock EventSearchService
    mockEventSearchService = {
      searchLongTermMemory: vi.fn(),
      searchByBM25: vi.fn(),
      searchByMetadata: vi.fn(),
      searchHybrid: vi.fn(),
    } as unknown as EventSearchService;

    service = new ContextAssemblyService(
      mockEventLogRepository,
      mockEventSearchService
    );
  });

  describe('assembleContext', () => {
    it('3가지 컨텍스트를 병렬로 조립해야 한다', async () => {
      // Given
      const mockEvents: EventLog[] = [
        new EventLog(
          new EventId(randomUUID()),
          new EventType('user_utterance'),
          new PageId(pageId),
          new UserId(userId),
          new Date(),
          new UtteranceContent('테스트 발화')
        ),
      ];

      vi.mocked(mockEventLogRepository.findRecentByPageId).mockResolvedValue(
        mockEvents
      );
      vi.mocked(mockEventSearchService.searchLongTermMemory).mockResolvedValue(
        {
          events: mockEvents,
          totalCount: 1,
          searchStrategy: 'hybrid',
        }
      );

      // When
      const context = await service.assembleContext(
        pageId,
        userId,
        '테스트 발화',
        ['block-1'],
        ['block-2']
      );

      // Then
      expect(context.shortTermMemory).toBeDefined();
      expect(context.longTermMemory).toBeDefined();
      expect(context.canvasContext).toBeDefined();
      expect(mockEventLogRepository.findRecentByPageId).toHaveBeenCalledWith(
        pageId,
        20
      );
      expect(
        mockEventSearchService.searchLongTermMemory
      ).toHaveBeenCalledWith('테스트 발화', pageId, 10, 7, 'hybrid');
    });

    it('빈 발화에 대해 예외를 발생시켜야 한다', async () => {
      // When & Then
      await expect(
        service.assembleContext(pageId, userId, '', ['block-1'])
      ).rejects.toThrow(AIManagementError);
    });

    it('잘못된 페이지 ID에 대해 예외를 발생시켜야 한다', async () => {
      // When & Then
      await expect(
        service.assembleContext('invalid-uuid', userId, 'test')
      ).rejects.toThrow(AIManagementError);
    });
  });

  describe('assembleShortTermMemory', () => {
    it('최근 N개 이벤트를 조회해야 한다', async () => {
      // Given
      const mockEvents: EventLog[] = [
        new EventLog(
          new EventId(randomUUID()),
          new EventType('user_utterance'),
          new PageId(pageId),
          new UserId(userId),
          new Date(),
          new UtteranceContent('발화 1')
        ),
      ];

      vi.mocked(mockEventLogRepository.findRecentByPageId).mockResolvedValue(
        mockEvents
      );

      // When
      const memory = await service.assembleShortTermMemory(pageId, 20);

      // Then
      expect(memory).toHaveLength(1);
      expect(memory[0]?.type).toBe('user_utterance');
      expect(mockEventLogRepository.findRecentByPageId).toHaveBeenCalledWith(
        pageId,
        20
      );
    });

    it('실패 시 빈 배열을 반환해야 한다', async () => {
      // Given
      vi.mocked(mockEventLogRepository.findRecentByPageId).mockRejectedValue(
        new Error('DB error')
      );

      // When
      const memory = await service.assembleShortTermMemory(pageId, 20);

      // Then
      expect(memory).toEqual([]);
    });
  });

  describe('assembleLongTermMemory', () => {
    it('BM25 검색으로 유사 이벤트를 조회해야 한다', async () => {
      // Given
      const mockEvents: EventLog[] = [
        new EventLog(
          new EventId(randomUUID()),
          new EventType('user_utterance'),
          new PageId(pageId),
          new UserId(userId),
          new Date(),
          new UtteranceContent('유사 발화')
        ),
      ];

      vi.mocked(mockEventSearchService.searchLongTermMemory).mockResolvedValue(
        {
          events: mockEvents,
          totalCount: 1,
          searchStrategy: 'hybrid',
        }
      );

      // When
      const memory = await service.assembleLongTermMemory(
        '테스트 쿼리',
        pageId,
        10,
        7
      );

      // Then
      expect(memory).toHaveLength(1);
      expect(memory[0]?.type).toBe('user_utterance');
    });

    it('실패 시 빈 배열을 반환해야 한다', async () => {
      // Given
      vi.mocked(mockEventSearchService.searchLongTermMemory).mockRejectedValue(
        new Error('Search error')
      );

      // When
      const memory = await service.assembleLongTermMemory(
        '테스트',
        pageId,
        10,
        7
      );

      // Then
      expect(memory).toEqual([]);
    });
  });

  describe('assembleCanvasContext', () => {
    it('Canvas Context를 조립해야 한다', async () => {
      // When
      const context = await service.assembleCanvasContext(
        pageId,
        ['block-1'],
        ['block-2']
      );

      // Then
      expect(context.selectedBlocks).toBeDefined();
      expect(context.nearbyBlocks).toBeDefined();
      expect(context.semanticBlocks).toBeDefined();
    });
  });

  describe('formatForAgent', () => {
    it('Agent 입력 포맷으로 변환해야 한다', () => {
      // Given
      const context: any = {
        shortTermMemory: [
          {
            timestamp: '2025-11-12T10:00:00Z',
            type: 'user_utterance',
            content: '테스트',
          },
        ],
        longTermMemory: [
          { content: '유사 작업', timeAgo: '2일 전' },
        ],
        canvasContext: {
          selectedBlocks: [{ id: 'block-1', type: 'markdown', title: '블럭 1' }],
          nearbyBlocks: [],
          semanticBlocks: [],
        },
      };

      // When
      const formatted = service.formatForAgent(context);

      // Then
      expect(formatted.contextPrompt).toContain('AI Agent');
      expect(formatted.contextPrompt).toContain('Selected Blocks');
      expect(formatted.context.shortTermMemory).toContain('테스트');
      expect(formatted.context.longTermMemory).toContain('유사 작업');
      expect(formatted.context.selectedBlocks).toContain('block-1');
    });
  });
});





