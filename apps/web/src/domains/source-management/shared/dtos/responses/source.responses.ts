export interface SourceCreatedDTO {
  sourceId: string;
  url: string;
  sourceType: string;
  createdAt: Date;
}

export interface SourceRawContentUpdatedDTO {
  sourceId: string;
  extractedAt: Date;
  updatedAt: Date;
}

export interface SourceContentDTO {
  sourceId: string;
  rawContent: string | null;
  contentLanguage: string | null;
  extractedAt: Date | null;
}
