/**
 * Tool Execution Request 인터페이스
 */
export interface ExecuteBlockToolRequest {
  blockId: string;
  toolName: string;
  parameters?: Record<string, any>;
}

/**
 * ToolRepository Interface
 *
 * 블록 도구 실행을 위한 Repository 인터페이스
 */
export interface ToolRepository {
  /**
   * 블록 툴 실행
   *
   * @param data - 툴 실행 요청 데이터
   * @returns Promise<툴 실행 결과>
   */
  executeBlockTool(data: ExecuteBlockToolRequest): Promise<{
    workspaceId: string;
    canvasId: string;
    newBlocks?: any[];
    result?: any;
  }>;

  /**
   * 블록의 툴 실행 히스토리 조회
   *
   * @param blockId - 블록 ID
   * @returns Promise<툴 실행 히스토리>
   */
  getToolExecutionHistory(blockId: string): Promise<any[]>;

  /**
   * 특정 툴의 마지막 실행 결과 조회
   *
   * @param blockId - 블록 ID
   * @param toolName - 툴 이름
   * @returns Promise<마지막 실행 결과>
   */
  getLastToolExecution(blockId: string, toolName: string): Promise<any | null>;
}
