/**
 * Tool Execution Result
 * 툴 실행 결과 (서버 사이드 툴 전용)
 */
export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  result?: Record<string, unknown>;
  errorMessage?: string;
  executionTime: number; // ms
}

/**
 * Server-Side Tool Parameters
 * 서버 사이드 툴의 파라미터 타입들
 *
 * Note: 클라이언트 사이드 툴 (addBlock, deleteBlock 등)은
 * 프론트엔드에서 직접 처리되므로 여기에 포함되지 않습니다.
 */
export interface SearchByHopParams {
  startBlockId: string;
  hops: number;
  direction?: 'out' | 'in' | 'both';
}

export interface SearchByKeywordParams {
  keyword: string;
  blockTypes?: string[];
}

export interface SearchBySemanticParams {
  query: string;
  topK: number;
  blockTypes?: string[];
}

/**
 * ToolExecutionService Interface
 *
 * 서버 사이드 Agent 툴 실행 서비스
 *
 * 역할:
 * - 서버에서만 실행 가능한 툴 처리 (검색, 조회 등)
 * - Block/Canvas Management Service 직접 호출
 * - 툴 실행 결과 파싱 및 표준화
 * - 에러 처리 및 재시도 로직
 * - Event Log 저장
 *
 * Note:
 * - 클라이언트 사이드 툴 (addBlock, deleteBlock 등)은
 *   프론트엔드에서 직접 처리되므로 이 서비스에 포함되지 않습니다.
 * - 서버 사이드 툴만 execute 함수를 가지고 있습니다.
 */
export interface ToolExecutionService {
  /**
   * Hop 검색 툴
   * 엣지를 통해 N-hop 떨어진 블럭 탐색
   */
  searchByHop(
    params: SearchByHopParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult>;

  /**
   * 키워드 검색 툴
   * 키워드로 블럭 검색 (제목, 속성, 콘텐츠)
   */
  searchByKeyword(
    params: SearchByKeywordParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult>;

  /**
   * 시맨틱 검색 툴
   * 시맨틱 유사도로 관련 블럭 검색
   */
  searchBySemantic(
    params: SearchBySemanticParams,
    pageId: string,
    userId: string
  ): Promise<ToolExecutionResult>;

  /**
   * 블럭 타입 검색 툴
   * 키워드로 블럭 타입 검색 또는 전체 목록 조회
   */
  searchBlockTypes(params: { query?: string }): Promise<ToolExecutionResult>;

  /**
   * 블럭 타입 디테일 조회 툴
   * 특정 블럭 타입의 상세 정보 조회
   */
  getBlockTypeDetail(params: {
    blockType: string;
  }): Promise<ToolExecutionResult>;
}
