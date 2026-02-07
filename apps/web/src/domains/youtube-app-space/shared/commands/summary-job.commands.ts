/**
 * Summary Job Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴 (1 Command : 1 Event)
 */

/**
 * Summary Job 생성 Command (pending 등록)
 *
 * 큐에 넣을 pending job 생성 시 사용
 */
export interface CreateSummaryJobCommand {
  blockId: string;
  orgId: string;
  youtubeId: string;
  language: string;
}

/**
 * Summary Job을 completed 상태로 등록하는 Command
 *
 * 이미 요약이 존재할 때 Realtime UI용으로 completed row 등록
 */
export interface RegisterSummaryJobCompletedCommand {
  blockId: string;
  orgId: string;
  youtubeId: string;
  language: string;
}

/**
 * Summary Job 완료 Command
 *
 * 워커가 요약 처리 완료 시
 */
export interface CompleteSummaryJobCommand {
  jobId: string;
}

/**
 * Summary Job 실패 Command
 *
 * 워커가 요약 처리 실패 시
 */
export interface FailSummaryJobCommand {
  jobId: string;
  errorMessage: string;
}
