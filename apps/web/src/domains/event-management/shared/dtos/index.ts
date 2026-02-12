/**
 * Event Management Domain DTOs
 */

export interface EventLogSummaryDTO {
  id: string;
  type: string;
  timestamp: string;
  content: string;
  timeAgo?: string;
}
