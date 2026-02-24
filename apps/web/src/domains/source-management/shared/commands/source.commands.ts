import type { SourceMetadata } from '../types/source-metadata.types';
import { LanguageCode } from '../value-objects/language-code.vo';
import { SourceId } from '../value-objects/source-id.vo';
import { SourceType } from '../value-objects/source-type.vo';
import { SourceUrl } from '../value-objects/source-url.vo';

export interface CreateSourceCommand {
  sourceId: SourceId;
  url: SourceUrl;
  sourceType: SourceType;
  metadata?: SourceMetadata;
  contentLanguage?: LanguageCode | null;
}

export interface UpdateSourceRawContentCommand {
  rawContent: string;
  extractedAt: Date;
  expiresAt: Date | null;
  /** e.g. from ElevenLabs STT → sources.content_language */
  contentLanguage?: string | null;
}

export interface UpdateSourceMetadataCommand {
  metadata: Partial<SourceMetadata>;
}
