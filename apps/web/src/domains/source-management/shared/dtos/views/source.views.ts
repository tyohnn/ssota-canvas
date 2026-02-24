export interface SourceView {
  id: string;
  url: string;
  sourceType: string;
  rawContent: string | null;
  metadata: Record<string, unknown>;
  contentLanguage: string | null;
  extractedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
