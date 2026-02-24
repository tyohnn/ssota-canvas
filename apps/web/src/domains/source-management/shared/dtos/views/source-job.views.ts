/**
 * Source Job View (조회/직렬화용)
 */
export interface SourceJobView {
  id: string;
  sourceId: string;
  blockId: string;
  orgId: string;
  language: string;
  status: string;
  currentStep: string | null;
  createdAt: string;
  startedAt: string | undefined;
  completedAt: string | undefined;
  errorMessage: string | undefined;
}

/**
 * 진행 중(pending/processing)인 Source Job 조회용 View
 * Status 창 복원, Realtime 구독 시 사용
 */
export interface InProgressSourceJobView {
  id: string;
  block_id: string;
  language: string;
  status: string;
  current_step: string | null;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}
