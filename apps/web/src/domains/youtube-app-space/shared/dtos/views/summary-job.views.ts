/**
 * Summary Job View (조회/직렬화용)
 */
export interface SummaryJobView {
  id: string;
  blockId: string;
  orgId: string;
  youtubeId: string;
  language: string;
  status: string;
  createdAt: string;
  startedAt: string | undefined;
  completedAt: string | undefined;
  errorMessage: string | undefined;
}
