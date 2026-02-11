import type { SourceMetadata } from '../types/source-metadata.types';
import { LanguageCode } from '../value-objects/language-code.vo';
import { SourceId } from '../value-objects/source-id.vo';
import { SourceType } from '../value-objects/source-type.vo';
import { SourceUrl } from '../value-objects/source-url.vo';

export class Source {
  private constructor(
    public readonly id: SourceId,
    public readonly url: SourceUrl,
    public readonly sourceType: SourceType,
    public rawContent: string | null,
    public metadata: SourceMetadata,
    public contentLanguage: LanguageCode | null,
    public extractedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly urlHash: string | null
  ) {}

  static create(
    id: SourceId,
    url: SourceUrl,
    sourceType: SourceType,
    metadata: SourceMetadata = {},
    contentLanguage: LanguageCode | null = null
  ): Source {
    const now = new Date();
    return new Source(
      id,
      url,
      sourceType,
      null,
      metadata,
      contentLanguage,
      null,
      now,
      now,
      url.urlHash
    );
  }

  static reconstitute(
    id: SourceId,
    url: SourceUrl,
    sourceType: SourceType,
    rawContent: string | null,
    metadata: SourceMetadata,
    contentLanguage: LanguageCode | null,
    extractedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    urlHash: string | null
  ): Source {
    return new Source(
      id,
      url,
      sourceType,
      rawContent,
      metadata,
      contentLanguage,
      extractedAt,
      createdAt,
      updatedAt,
      urlHash
    );
  }

  updateRawContent(rawContent: string, extractedAt: Date): void {
    this.rawContent = rawContent;
    this.extractedAt = extractedAt;
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<SourceMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata } as SourceMetadata;
    this.updatedAt = new Date();
  }

  hasRawContent(): boolean {
    return this.rawContent != null && this.rawContent.length > 0;
  }
}
