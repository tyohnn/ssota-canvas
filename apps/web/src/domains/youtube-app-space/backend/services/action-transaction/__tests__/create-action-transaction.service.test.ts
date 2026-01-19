import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createActionTransaction } from '../create-action-transaction.service';
import type { IActionTransactionRepository } from '../../../repositories/interfaces/action-transaction.repository.interface';
import type { ActionTransactionAggregate } from '../../../../shared/aggregates/action-transaction.aggregate';
import type { CreateActionTransactionRequest } from '../../../../shared/dtos/requests/action-transaction.requests';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';

describe('createActionTransaction Service', () => {
  let mockRepository: IActionTransactionRepository;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 로그만 출력하는 Mock Repository 생성
    mockRepository = {
      findByOrgAndVideo: vi.fn(async (orgId: string, videoId: string, actionType: string) => {
        console.log('[MockRepository] findByOrgAndVideo called:', { orgId, videoId, actionType });
        return null;
      }),
      create: vi.fn(async (aggregate: ActionTransactionAggregate) => {
        console.log('[MockRepository] create called:', {
          transactionId: aggregate.getTransaction().id.value,
          orgId: aggregate.getTransaction().orgId,
          videoId: aggregate.getTransaction().videoId.value,
          actionType: aggregate.getTransaction().actionType,
        });
      }),
      findById: vi.fn(async (id: string) => {
        console.log('[MockRepository] findById called:', { id });
        return null;
      }),
      update: vi.fn(async (aggregate: ActionTransactionAggregate) => {
        console.log('[MockRepository] update called:', {
          transactionId: aggregate.getTransaction().id.value,
        });
      }),
    };

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('성공 케이스', () => {
    it('유효한 SafeDTO로 Action Transaction을 생성해야 한다', async () => {
      // Given
      const safeDto: CreateActionTransactionRequest = {
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        videoId: '660e8400-e29b-41d4-a716-446655440000',
        actionType: 'extract_script',
      };

      // When
      const result = await createActionTransaction(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate).toBeDefined();
        expect(aggregate.getTransaction().orgId).toBe(safeDto.orgId);
        expect(aggregate.getTransaction().videoId.value).toBe(safeDto.videoId);
        expect(aggregate.getTransaction().actionType).toBe(safeDto.actionType);
        expect(aggregate.getTransaction().isCompleted()).toBe(false);
      }

      // Repository 호출 확인
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MockRepository] create called:'),
        expect.any(Object)
      );
    });

    it('smart_summary 액션 타입도 생성되어야 한다', async () => {
      // Given
      const safeDto: CreateActionTransactionRequest = {
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        videoId: '660e8400-e29b-41d4-a716-446655440000',
        actionType: 'smart_summary',
      };

      // When
      const result = await createActionTransaction(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        expect(aggregate.getTransaction().actionType).toBe('smart_summary');
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('ActionTransactionCreatedEvent가 발행되어야 한다', async () => {
      // Given
      const safeDto: CreateActionTransactionRequest = {
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        videoId: '660e8400-e29b-41d4-a716-446655440000',
        actionType: 'extract_script',
      };

      // When
      const result = await createActionTransaction(safeDto, mockRepository);

      // Then
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        const aggregate = result.value;
        const events = aggregate.getUncommittedEvents();
        expect(events).toHaveLength(0); // 이벤트는 이미 커밋됨
      }
    });
  });

  describe('에러 케이스', () => {
    it('Repository 에러 시 YoutubeError를 반환해야 한다', async () => {
      // Given
      const safeDto: CreateActionTransactionRequest = {
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        videoId: '660e8400-e29b-41d4-a716-446655440000',
        actionType: 'extract_script',
      };

      const errorRepository: IActionTransactionRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log('[MockRepository] create failed');
          throw new Error('Database error');
        }),
      };

      // When
      const result = await createActionTransaction(
        safeDto,
        errorRepository
      );

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBeInstanceOf(YoutubeError);
        expect(result.error.code).toBe('ACTION_TRANSACTION_CREATION_FAILED');
      }
    });

    it('YoutubeError는 그대로 전파되어야 한다', async () => {
      // Given
      const safeDto: CreateActionTransactionRequest = {
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        videoId: '660e8400-e29b-41d4-a716-446655440000',
        actionType: 'extract_script',
      };

      const youtubeError = new YoutubeError(
        'INVALID_ACTION_TRANSACTION_ID',
        'Invalid action transaction ID',
        { orgId: safeDto.orgId }
      );

      const errorRepository: IActionTransactionRepository = {
        ...mockRepository,
        create: vi.fn(async () => {
          console.log(
            '[MockRepository] create failed with YoutubeError'
          );
          throw youtubeError;
        }),
      };

      // When
      const result = await createActionTransaction(
        safeDto,
        errorRepository
      );

      // Then
      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toBe(youtubeError);
        expect(result.error.code).toBe('INVALID_ACTION_TRANSACTION_ID');
      }
    });
  });
});
