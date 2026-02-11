/**
 * Source-type-specific metadata (App Space references, etc.).
 * Union allows type-safe access when sourceType is known.
 */

export interface YoutubeSourceMetadata {
  appSpaceId?: string;
  videoSlug?: string;
  [key: string]: unknown;
}

export interface PdfSourceMetadata {
  [key: string]: unknown;
}

export interface XSourceMetadata {
  [key: string]: unknown;
}

export interface ThreadSourceMetadata {
  [key: string]: unknown;
}

export interface AudioSourceMetadata {
  [key: string]: unknown;
}

export interface LinkSourceMetadata {
  [key: string]: unknown;
}

export type SourceMetadata =
  | YoutubeSourceMetadata
  | PdfSourceMetadata
  | XSourceMetadata
  | ThreadSourceMetadata
  | AudioSourceMetadata
  | LinkSourceMetadata;
