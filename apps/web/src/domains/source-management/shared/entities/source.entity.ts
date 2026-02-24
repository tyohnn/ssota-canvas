import { SourceId } from '../value-objects/source-id.vo';
import { SourceType } from '../value-objects/source-type.vo';
import { SourceUrl } from '../value-objects/source-url.vo';

export class Source {
  private _url: SourceUrl;

  private constructor(
    public readonly id: SourceId,
    url: SourceUrl,
    public readonly sourceType: SourceType,
    public rawContent: string | null,
    public metadata: Record<string, unknown>,
    public contentLanguage: string | null,
    public extractedAt: Date | null,
    public expiresAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    this._url = url;
  }

  get url(): SourceUrl {
    return this._url;
  }

  get urlHash(): string {
    return this._url.urlHash;
  }

  updateUrl(newUrl: SourceUrl): void {
    this._url = newUrl;
    this.updatedAt = new Date();
  }

  static create(
    id: SourceId,
    url: SourceUrl,
    sourceType: SourceType,
    metadata: Record<string, unknown> = {},
    contentLanguage: string | null = null
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
      null,
      now,
      now,
    );
  }

  static reconstitute(
    id: SourceId,
    url: SourceUrl,
    sourceType: SourceType,
    rawContent: string | null,
    metadata: Record<string, unknown>,
    contentLanguage: string | null,
    extractedAt: Date | null,
    expiresAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): Source {
    return new Source(
      id,
      url,
      sourceType,
      rawContent,
      metadata,
      contentLanguage,
      extractedAt,
      expiresAt,
      createdAt,
      updatedAt,
    );
  }

  updateRawContent(
    rawContent: string,
    extractedAt: Date,
    expiresAt: Date | null,
    contentLanguage?: string | null
  ): void {
    this.rawContent = rawContent;
    this.extractedAt = extractedAt;
    this.expiresAt = expiresAt;
    if (contentLanguage !== undefined) {
      this.contentLanguage = contentLanguage;
    }
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  hasRawContent(): boolean {
    return this.rawContent != null && this.rawContent.length > 0;
  }
}
