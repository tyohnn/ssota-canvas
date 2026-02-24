import type { EventLog } from '@/domains/event-management';

/**
 * Event Log Summary
 * 이벤트 로그 요약 정보 (컨텍스트 전달용)
 */
export interface EventLogSummary {
  id: string;
  type: string;
  timestamp: string; // ISO 8601 string
  content: string; // 요약된 내용 (최대 200자)
  metadata?: Record<string, unknown>;
  timeAgo?: string; // "2일 전", "1시간 전"
}

/**
 * Assembled Context
 * 3가지 컨텍스트(Short-Term, Long-Term, Canvas)를 조립한 결과
 */
export interface AssembledContext {
  shortTermMemory: EventLogSummary[]; // 최근 20개 이벤트
  longTermMemory: EventLogSummary[]; // 시맨틱 검색 결과 (상위 10개)
  canvasContext: CanvasContext; // 선택/주변/의미적 블럭
}

/**
 * Canvas Context
 * 선택된 블럭, 주변 블럭, 연결된 블럭, 의미적 블럭 정보
 */
export interface CanvasContext {
  selectedBlocks: BlockInfo[]; // 선택된 블럭
  nearbyBlocks: BlockInfo[]; // 주변 블럭
  connectedBlocks: BlockInfo[]; // 연결된 블럭 (1-hop via edges)
  semanticBlocks: BlockInfo[]; // 의미적 블럭 (MVP에서는 빈 배열 가능)
}

/**
 * Block Info
 * 블럭 기본 정보 (컨텍스트 전달용)
 */
export interface BlockInfo {
  blockId: string; // 블럭 ID (실제 블록 데이터 ID - 서버 액션용)
  blockMountId: string; // 블럭 마운트 ID (페이지에 배치된 인스턴스 ID - React Flow node ID)
  type: string;
  title: string;
  properties: Record<string, unknown>;
  customProperties: Record<string, unknown>;
  content?: unknown;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

/**
 * Agent Input Format
 * Vercel AI SDK Agent에 전달할 포맷
 */
export interface AgentInputFormat {
  contextPrompt: string; // 컨텍스트 정보만 포함된 프롬프트
  context: {
    shortTermMemory: string; // 텍스트로 변환
    longTermMemory: string; // 텍스트로 변환
    selectedBlocks: string; // 텍스트로 변환
    nearbyBlocks: string; // 텍스트로 변환
    semanticBlocks: string; // 텍스트로 변환
  };
}

/**
 * ContextAssemblyService Interface
 *
 * 3가지 컨텍스트(Short-Term, Long-Term, Canvas)를 병렬로 수집하고 조합하는 Domain Service
 */
export interface ContextAssemblyService {
  /**
   * 전체 컨텍스트 조립
   * @param pageId - 페이지 ID
   * @param userId - 사용자 ID
   * @param utterance - 사용자 발화
   * @param selectedBlockIds - 선택된 블럭 ID 목록 (선택적)
   * @param visibleBlockIds - 화면에 보이는 블럭 ID 목록 (선택적)
   * @returns 조립된 컨텍스트
   */
  assembleContext(
    pageId: string,
    userId: string,
    utterance: string,
    selectedBlockIds?: string[],
    visibleBlockIds?: string[]
  ): Promise<AssembledContext>;

  /**
   * Short-Term Memory 조립
   * 페이지별 최근 N개 이벤트 조회
   */
  assembleShortTermMemory(
    pageId: string,
    limit?: number
  ): Promise<EventLogSummary[]>;

  /**
   * Long-Term Memory 조립
   * BM25 검색으로 유사 이벤트 복원
   */
  assembleLongTermMemory(
    queryText: string,
    pageId: string,
    topK?: number,
    timeWeightFactor?: number
  ): Promise<EventLogSummary[]>;

  /**
   * Canvas Context 조립
   * 선택/주변/의미적 블럭 정보 수집
   */
  assembleCanvasContext(
    pageId: string,
    selectedBlockIds?: string[],
    visibleBlockIds?: string[]
  ): Promise<CanvasContext>;

  /**
   * Agent 입력 포맷으로 변환
   * AssembledContext를 Vercel AI SDK Agent 입력으로 변환
   */
  formatForAgent(context: AssembledContext): AgentInputFormat;

  /**
   * System Prompt 빌드
   * 전체 시스템 프롬프트 생성 (Base Prompt + Context Prompt)
   */
  buildSystemPrompt(context: AssembledContext): string;
}
