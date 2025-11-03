/**
 * Block Tool Service
 *
 * 블록의 툴 실행을 담당하는 서비스
 * - 블록 툴 실행
 * - AI 블록 툴 실행
 * - 툴 검증
 * - 툴 결과 관리
 */

import { Block } from '../../shared/entities/block.entity';
import { BlockManagementError } from '../../shared/errors/block-management.error';

/**
 * 툴 실행 결과 인터페이스
 */
export interface ToolExecutionResult {
  success: boolean;
  toolType: string;
  result: any;
  executedAt: Date;
  error?: string;
}

/**
 * AI 툴 실행 결과 인터페이스
 */
export interface AIToolExecutionResult extends ToolExecutionResult {
  aiContext: Record<string, any>;
  aiModel?: string;
  tokensUsed?: number;
}

/**
 * Block Tool Service
 */
export class BlockToolService {
  /**
   * 블록 툴 실행
   *
   * @param block - 대상 블록
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @returns 실행 결과
   */
  async executeBlockTool(
    block: Block,
    toolType: string,
    parameters: Record<string, any> = {}
  ): Promise<ToolExecutionResult> {
    if (block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot execute tool on deleted block'
      );
    }

    const availableTools = block.getAvailableTools();
    if (!availableTools.includes(toolType)) {
      throw new BlockManagementError(
        'BLOCK_TOOL_EXECUTION_FAILED',
        `Tool ${toolType} is not available for block type ${block.blockType.value}`
      );
    }

    try {
      // 실제 툴 실행 로직은 Infrastructure Layer에서 처리
      // 여기서는 기본적인 검증만 수행
      const result = await this.executeToolInternal(toolType, parameters);

      return {
        success: true,
        toolType,
        result,
        executedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        toolType,
        result: null,
        executedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * AI 블록 툴 실행
   *
   * @param block - 대상 블록
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @param aiContext - AI 컨텍스트
   * @returns 실행 결과
   */
  async executeBlockToolByAI(
    block: Block,
    toolType: string,
    parameters: Record<string, any> = {},
    aiContext: Record<string, any> = {}
  ): Promise<AIToolExecutionResult> {
    if (block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot execute tool on deleted block'
      );
    }

    const availableTools = block.getAvailableTools();
    if (!availableTools.includes(toolType)) {
      throw new BlockManagementError(
        'BLOCK_TOOL_EXECUTION_FAILED',
        `Tool ${toolType} is not available for block type ${block.blockType.value}`
      );
    }

    try {
      // AI 컨텍스트와 함께 툴 실행
      const result = await this.executeAIToolInternal(
        toolType,
        parameters,
        aiContext
      );

      return {
        success: true,
        toolType,
        result,
        executedAt: new Date(),
        aiContext,
        aiModel: aiContext.model || 'default',
        tokensUsed: result.tokensUsed || 0,
      };
    } catch (error) {
      return {
        success: false,
        toolType,
        result: null,
        executedAt: new Date(),
        aiContext,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 툴 지원 여부 확인
   *
   * @param block - 대상 블록
   * @param toolType - 툴 타입
   * @returns 지원 여부
   */
  supportsTool(block: Block, toolType: string): boolean {
    return block.supportsTool(toolType);
  }

  /**
   * 사용 가능한 툴 목록 가져오기
   *
   * @param block - 대상 블록
   * @returns 사용 가능한 툴 목록
   */
  getAvailableTools(block: Block): string[] {
    return block.getAvailableTools();
  }

  /**
   * 툴 실행 검증
   *
   * @param block - 대상 블록
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @returns 검증 결과
   */
  validateToolExecution(
    block: Block,
    toolType: string,
    parameters: Record<string, any>
  ): { isValid: boolean; error?: string } {
    if (block.isDeleted()) {
      return {
        isValid: false,
        error: 'Cannot execute tool on deleted block',
      };
    }

    if (!block.supportsTool(toolType)) {
      return {
        isValid: false,
        error: `Tool ${toolType} is not available for block type ${block.blockType.value}`,
      };
    }

    // 툴별 파라미터 검증 로직
    // TODO: 각 툴별로 구체적인 검증 로직 구현

    return { isValid: true };
  }

  /**
   * 내부 툴 실행 (Infrastructure Layer와의 인터페이스)
   *
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @returns 실행 결과
   */
  private async executeToolInternal(
    toolType: string,
    parameters: Record<string, any>
  ): Promise<any> {
    // 실제 툴 실행 로직은 Infrastructure Layer에서 처리
    // 여기서는 Mock 구현
    return {
      message: `Tool ${toolType} executed successfully`,
      parameters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 내부 AI 툴 실행 (Infrastructure Layer와의 인터페이스)
   *
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @param aiContext - AI 컨텍스트
   * @returns 실행 결과
   */
  private async executeAIToolInternal(
    toolType: string,
    parameters: Record<string, any>,
    aiContext: Record<string, any>
  ): Promise<any> {
    // 실제 AI 툴 실행 로직은 Infrastructure Layer에서 처리
    // 여기서는 Mock 구현
    return {
      message: `AI Tool ${toolType} executed successfully`,
      parameters,
      aiContext,
      tokensUsed: Math.floor(Math.random() * 1000), // Mock token usage
      timestamp: new Date().toISOString(),
    };
  }
}
