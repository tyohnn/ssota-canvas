import { LanguageCode } from '../value-objects/language-code.vo';
import { SourceId } from '../value-objects/source-id.vo';
import { SourceSummaryId } from '../value-objects/source-summary-id.vo';

export class SourceSummary {
  private constructor(
    public readonly id: SourceSummaryId,
    public readonly sourceId: SourceId,
    public readonly language: LanguageCode,
    public summary: string,
    public keywords: string[],
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(
    id: SourceSummaryId,
    sourceId: SourceId,
    language: LanguageCode,
    summary: string,
    keywords: string[] = []
  ): SourceSummary {
    const now = new Date();
    return new SourceSummary(
      id,
      sourceId,
      language,
      summary,
      keywords,
      now,
      now
    );
  }

  static reconstitute(
    id: SourceSummaryId,
    sourceId: SourceId,
    language: LanguageCode,
    summary: string,
    keywords: string[],
    createdAt: Date,
    updatedAt: Date
  ): SourceSummary {
    return new SourceSummary(
      id,
      sourceId,
      language,
      summary,
      keywords,
      createdAt,
      updatedAt
    );
  }

  updateSummary(summary: string, keywords: string[]): void {
    this.summary = summary;
    this.keywords = keywords;
    this.updatedAt = new Date();
  }
}
