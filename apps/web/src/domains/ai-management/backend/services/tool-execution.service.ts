import {
  ToolExecutionService as IToolExecutionService,
  ToolExecutionResult,
  SearchByHopParams,
  SearchByKeywordParams,
  SearchBySemanticParams,
} from './interfaces/tool-execution.service.interface';
import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import { EventLogAggregate } from '../../shared/aggregates/event-log.aggregate';
import { LogToolCallCommand } from '../../shared/commands';
import {
  AIManagementError,
  AIManagementErrorCode,
} from '../../shared/errors/ai-management.error';
import {
  getBlockTypeDetail as getBlockTypeDetailFromDef,
  searchBlockTypes as searchBlockTypesFromDef,
  ALL_BLOCK_TYPES,
  BLOCK_TYPE_DEFINITIONS,
} from './prompt/block-type-definitions';

/**
 * ToolExecutionService 구현
 *
 * 서버 사이드 Agent 툴 실행 서비스
 *
 * 특징:
 * - 서버에서만 실행 가능한 툴 처리 (검색, 조회 등)
 * - Block/Canvas Management Service 직접 호출 (향후 구현)
 * - 툴 실행 결과 파싱 및 표준화
 * - 에러 처리 및 재시도 로직 (최대 3회)
 * - Event Log 자동 저장
 *
 * Note:
 * - 클라이언트 사이드 툴 (addBlock, deleteBlock 등)은
 *   프론트엔드에서 직접 처리되므로 이 서비스에 포함되지 않습니다.
 */
export class ToolExecutionService implements IToolExecutionService {
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 30000; // 30초

  constructor(
    private readonly eventLogRepository: EventLogRepository
    // TODO: BlockManagementService, CanvasManagementService 주입
  ) {}

  /**
   * Hop 검색 툴
   */
  async searchByHop(
    params: SearchByHopParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult> {
    // TODO: CanvasManagementService.searchByHop() 직접 호출

    return {
      success: true,
      toolName: 'searchByHop',
      result: { blocks: [], message: 'Hop search completed (mock)' },
      executionTime: 0,
    };
  }

  /**
   * 키워드 검색 툴
   */
  async searchByKeyword(
    params: SearchByKeywordParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult> {
    // TODO: CanvasManagementService.searchByKeyword() 직접 호출

    return {
      success: true,
      toolName: 'searchByKeyword',
      result: { blocks: [], message: 'Keyword search completed (mock)' },
      executionTime: 0,
    };
  }

  /**
   * 시맨틱 검색 툴
   */
  async searchBySemantic(
    params: SearchBySemanticParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult> {
    // TODO: Implement semantic search with embeddings
    // 1. 쿼리를 임베딩으로 변환
    // 2. 벡터 DB에서 유사도 검색
    // 3. topK 개의 블럭 반환

    return {
      success: true,
      toolName: 'searchBySemantic',
      result: {
        blocks: [],
        topK: params.topK,
        message: 'Semantic search not yet implemented (MVP)',
      },
      executionTime: 0,
    };
  }

  /**
   * 블럭 타입 검색 툴
   */
  async searchBlockTypes(params: {
    query?: string;
  }): Promise<ToolExecutionResult> {
    try {
      const query = params.query || '';
      let blockTypes;

      if (query) {
        // 키워드로 검색
        blockTypes = searchBlockTypesFromDef(query).map(def => ({
          type: def.type,
          name: def.name,
          description: def.description,
          useCases: def.useCases,
        }));
      } else {
        // 전체 리스트 반환
        blockTypes = ALL_BLOCK_TYPES.map(type => {
          const def = BLOCK_TYPE_DEFINITIONS[type];
          return {
            type,
            name: def?.name || type,
            description: def?.description || '',
            useCases: def?.useCases || [],
          };
        });
      }

      return {
        success: true,
        toolName: 'searchBlockTypes',
        result: {
          blockTypes,
          total: blockTypes.length,
          query: query || 'all',
        },
        executionTime: 0,
      };
    } catch (error) {
      throw new AIManagementError(
        AIManagementErrorCode.TOOL_EXECUTION_FAILED,
        `Failed to search block types: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블럭 타입 디테일 조회 툴
   */
  async getBlockTypeDetail(params: {
    blockType: string;
  }): Promise<ToolExecutionResult> {
    try {
      const detail = getBlockTypeDetailFromDef(params.blockType);

      if (!detail) {
        return {
          success: false,
          toolName: 'getBlockTypeDetail',
          result: {
            error: `Block type '${params.blockType}' not found`,
            availableTypes: ALL_BLOCK_TYPES,
          },
          executionTime: 0,
        };
      }

      return {
        success: true,
        toolName: 'getBlockTypeDetail',
        result: {
          type: detail.type,
          name: detail.name,
          description: detail.description,
          useCases: detail.useCases,
          basicProperties: detail.basicProperties,
          actions: detail.actions,
          examples: detail.examples,
        },
        executionTime: 0,
      };
    } catch (error) {
      throw new AIManagementError(
        AIManagementErrorCode.TOOL_EXECUTION_FAILED,
        `Failed to get block type detail: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * 툴 실행 with 재시도 로직
   * 재시도 가능한 에러(네트워크 에러)는 최대 3회 재시도
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = ToolExecutionService.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 재시도 가능한 에러인지 확인
        if (this.isRetryableError(error)) {
          console.warn(
            `Tool execution failed (attempt ${attempt + 1}/${retries}), retrying...`,
            error
          );
          await this.delay(1000 * (attempt + 1)); // 지수 백오프
          continue;
        }

        // 재시도 불가능한 에러는 즉시 throw
        throw error;
      }
    }

    throw lastError || new Error('Tool execution failed after retries');
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection')
      );
    }
    return false;
  }

  /**
   * 지연 (재시도용)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 툴 이름 검증 (서버 사이드 툴만)
   */
  private validateToolName(toolName: string): void {
    const validServerTools = [
      'searchByHop',
      'searchByKeyword',
      'searchBySemantic',
      'searchBlockTypes',
    ];

    if (!validServerTools.includes(toolName)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_TOOL_NAME,
        `Invalid server-side tool name: ${toolName}. Client-side tools should be handled on the frontend.`
      );
    }
  }

  /**
   * 툴 호출 이벤트 로깅
   */
  private async logToolCall(
    toolName: string,
    params: Record<string, unknown>,
    result: ToolExecutionResult,
    pageId: string,
    userId: string,
    agentExecutionId: string,
    executionTime: number
  ): Promise<void> {
    try {
      const aggregate = new EventLogAggregate();

      const command: LogToolCallCommand = {
        toolName,
        params,
        result: result.result || {},
        pageId,
        userId,
        agentExecutionId,
        executionTime,
        success: result.success,
        errorMessage: result.errorMessage,
      };

      const events = aggregate.logToolCall(command);

      // Event Log 저장 (비동기, 실패해도 툴 실행은 성공으로 처리)
      for (const event of events) {
        // TODO: EventLog Entity로 변환 후 저장
        // await this.eventLogRepository.save(eventLogEntity);
      }
    } catch (error) {
      console.error('Failed to log tool call:', error);
      // 로깅 실패는 무시 (툴 실행 자체는 성공)
    }
  }
}
