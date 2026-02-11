export interface SourceSummaryView {
  id: string;
  sourceId: string;
  language: string;
  summary: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}
