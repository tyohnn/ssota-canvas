/**
 * AI Management Domain - Commands
 * 사용자 의도를 표현하는 Command 인터페이스들
 */

/**
 * LogUserUtteranceCommand
 * 사용자 발화 로깅 명령
 */
export interface LogUserUtteranceCommand {
  utterance: string; // 사용자 발화 내용 (1자 이상)
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  selectedBlockIds?: string[]; // 선택된 블럭 ID 목록 (선택적)
  nearbyBlockIds?: string[]; // 주변 블럭 ID 목록 (선택적)
  visibleBlockIds?: string[]; // 화면에 보이는 블럭 ID 목록 (선택적)
}

/**
 * LogAIResponseCommand
 * AI 응답 로깅 명령
 */
export interface LogAIResponseCommand {
  response: string; // AI 응답 내용 (1자 이상)
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  relatedUtteranceEventId: string; // 연관된 발화 이벤트 ID (UUID)
  agentLoopCount: number; // Agent Loop 횟수 (1-10)
  model?: string; // LLM 모델명 (선택적)
  tokens?: number; // 토큰 사용량 (선택적)
}

/**
 * LogToolCallCommand
 * 툴 호출 로깅 명령
 */
export interface LogToolCallCommand {
  toolName: string; // 툴 이름
  params: Record<string, unknown>; // 툴 파라미터 (JSONB)
  result: Record<string, unknown>; // 툴 실행 결과 (JSONB)
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  agentExecutionId: string; // Agent 실행 ID (같은 Agent 실행 내 툴 콜 그룹핑)
  executionTime: number; // 실행 시간 (ms)
  success: boolean; // 성공 여부
  errorMessage?: string; // 에러 메시지 (선택적)
}

/**
 * LogBlockCreatedCommand
 * 블럭 생성 로깅 명령
 */
export interface LogBlockCreatedCommand {
  blockId: string; // 블럭 ID (UUID)
  blockType: string; // 블럭 타입
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  properties?: Record<string, unknown>; // 블럭 속성 (선택적)
  agentExecutionId?: string; // Agent 실행 ID (Agent가 생성한 경우, 선택적)
}

/**
 * LogBlockUpdatedCommand
 * 블럭 수정 로깅 명령
 */
export interface LogBlockUpdatedCommand {
  blockId: string; // 블럭 ID (UUID)
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  changes: Record<string, unknown>; // 변경 내용
  agentExecutionId?: string; // Agent 실행 ID (Agent가 수정한 경우, 선택적)
}

/**
 * LogBlockDeletedCommand
 * 블럭 삭제 로깅 명령
 */
export interface LogBlockDeletedCommand {
  blockId: string; // 블럭 ID (UUID)
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  agentExecutionId?: string; // Agent 실행 ID (Agent가 삭제한 경우, 선택적)
}

/**
 * SearchLongTermMemoryCommand
 * Long-Term Memory 검색 명령
 */
export interface SearchLongTermMemoryCommand {
  queryText: string; // 검색 쿼리 텍스트
  pageId: string; // 페이지 ID (UUID)
  userId: string; // 사용자 ID (UUID)
  topK?: number; // 반환할 최대 이벤트 개수 (기본값 10)
  timeWeightFactor?: number; // 시간 가중치 τ (기본값 7일)
  searchStrategy?: 'bm25' | 'metadata' | 'hybrid'; // 검색 전략 (기본값 'hybrid')
  eventTypeFilter?: string[]; // 이벤트 타입 필터 (선택적)
}
