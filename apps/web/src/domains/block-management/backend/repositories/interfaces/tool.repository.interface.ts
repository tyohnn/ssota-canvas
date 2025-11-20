/**
 * Tool Repository Interface
 *
 * 블록 툴 실행을 위한 Repository 인터페이스
 */

export interface ExecuteBlockToolRequest {
  blockId: string;
  toolName: string;
  parameters?: Record<string, any>;
}

export interface ExecuteBlockToolResult {
  blockId: string;
  toolName: string;
  result: any;
  workspaceId: string;
  canvasId: string;
  newBlocks?: Array<{
    id: string;
    type: string;
    data: any;
    position: { x: number; y: number };
  }>;
}

export interface IToolRepository {
  /**
   * 블록 툴 실행
   *
   * @param request 툴 실행 요청
   * @returns 실행 결과
   */
  executeBlockTool(
    request: ExecuteBlockToolRequest
  ): Promise<ExecuteBlockToolResult>;
}
