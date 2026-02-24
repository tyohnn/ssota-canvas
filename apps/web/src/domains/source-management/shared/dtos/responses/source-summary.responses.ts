export interface SourceSummaryDTO {
  sourceId: string;
  language: string;
  summary: string;
  keywords: string[];
  updatedAt: Date;
}

export interface SourceSummaryLanguagesDTO {
  sourceId: string;
  languages: string[];
}
