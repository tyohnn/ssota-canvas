import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolExecutionService } from '../tool-execution.service';
import { EventLogRepository } from '../../repositories/interfaces/event-log.repository.interface';
import { AIManagementError } from '../../../shared/errors/ai-management.error';
import { randomUUID } from 'crypto';

/**
 * ToolExecutionService 단위 테스트 (서버 사이드 툴만)
 * Repository를 Mock하여 테스트
 *
 * Note: 클라이언트 사이드 툴 (addBlock, deleteBlock 등)은
 * 프론트엔드에서 직접 처리되므로 테스트하지 않습니다.
 */
describe('ToolExecutionService', () => {
  let service: ToolExecutionService;
  let mockEventLogRepository: EventLogRepository;
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
      searchByBM25: vi.fn(),
      searchByMetadata: vi.fn(),
      searchHybrid: vi.fn(),
      countByType: vi.fn(),
      findByAgentExecutionId: vi.fn(),
    };

    service = new ToolExecutionService(mockEventLogRepository);
  });

  describe('searchByHop', () => {
    it('Hop 검색 툴을 실행해야 한다', async () => {
      // Given
      const params = {
        startBlockId: randomUUID(),
        hops: 2,
        direction: 'out' as const,
      };

      // When
      const result = await service.searchByHop(params, pageId, userId);

      // Then
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchByHop');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('searchByKeyword', () => {
    it('키워드 검색 툴을 실행해야 한다', async () => {
      // Given
      const params = { keyword: 'test', blockTypes: ['markdown'] };

      // When
      const result = await service.searchByKeyword(params, pageId, userId);

      // Then
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchByKeyword');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('blockTypes 없이도 실행되어야 한다', async () => {
      // Given
      const params = { keyword: 'test' };

      // When
      const result = await service.searchByKeyword(params, pageId, userId);

      // Then
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchByKeyword');
    });
  });

  describe('searchBySemantic', () => {
    it('시맨틱 검색 툴을 실행해야 한다', async () => {
      // Given
      const params = {
        query: 'machine learning algorithms',
        topK: 10,
        blockTypes: ['markdown', 'text'],
      };

      // When
      const result = await service.searchBySemantic(params, pageId, userId);

      // Then
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchBySemantic');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('searchBlockTypes', () => {
    it('블럭 타입 목록을 조회해야 한다', async () => {
      // When
      const result = await service.searchBlockTypes({});

      // Then
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchBlockTypes');
      expect(result.result?.blockTypes).toBeDefined();
      expect(Array.isArray(result.result?.blockTypes)).toBe(true);
      expect((result.result?.blockTypes as any[]).length).toBeGreaterThan(0);
    });

    it('각 블럭 타입에 필수 정보가 포함되어야 한다', async () => {
      // When
      const result = await service.searchBlockTypes({});
      const blockTypes = result.result?.blockTypes as any[];

      // Then (서비스 반환: type, name, description, useCases)
      blockTypes.forEach((blockType: any) => {
        expect(blockType.type).toBeDefined();
        expect(blockType.name).toBeDefined();
        expect(blockType.description).toBeDefined();
        expect(Array.isArray(blockType.useCases)).toBe(true);
      });
    });
  });
});





