/**
 * PDF Block Properties Value Object
 *
 * PDF 문서를 표시하는 블록의 속성을 관리하는 Value Object
 * - pathUrl: Supabase 스토리지 경로 (만료 없음). 외부 URL일 땐 ''.
 * - accessUrl: 뷰어/추출에 사용하는 URL (Signed URL 또는 외부 URL).
 */

import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

export interface PdfBlockProperties {
  pathUrl: string;
  accessUrl: string;
  accessUrlExpiresAt?: string | null;
  filename?: string;
  pageCount?: number;

  sourceSummaryAccessLanguages?: string[];
  sourceRawContentAccessGranted?: boolean;
}

export class PdfBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly pathUrl: string,
    public readonly accessUrl: string,
    public readonly accessUrlExpiresAt: string | null | undefined,
    public readonly filename: string | undefined,
    public readonly pageCount: number | undefined,
    public readonly sourceSummaryAccessLanguages: string[] | undefined,
    public readonly sourceRawContentAccessGranted: boolean | undefined,
  ) {
    super();
    this.validate();
  }

  static createDefault(): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      '',
      '',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  static fromJSON(data: unknown): PdfBlockPropertiesVO {
    const safeData = (data as Partial<PdfBlockProperties>) ?? {};
    const pathUrl = safeData.pathUrl ?? '';
    const accessUrl =
      safeData.accessUrl ?? (safeData as { url?: string }).url ?? '';
    return new PdfBlockPropertiesVO(
      pathUrl,
      accessUrl,
      safeData.accessUrlExpiresAt,
      safeData.filename,
      safeData.pageCount,
      safeData.sourceSummaryAccessLanguages,
      safeData.sourceRawContentAccessGranted,
    );
  }

  protected validate(): boolean {
    if (this.accessUrl && !this.isValidPdfUrl(this.accessUrl)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid PDF URL format'
      );
    }

    if (
      this.pageCount !== undefined &&
      (typeof this.pageCount !== 'number' || this.pageCount < 1)
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Page count must be a positive number'
      );
    }

    return true;
  }

  private isValidPdfUrl(url: string): boolean {
    const pdfRegex = /\.pdf(\?.*)?$/i;
    const blobRegex = /^blob:/;
    const dataRegex = /^data:application\/pdf/;
    const supabaseRegex = /supabase/i;
    return (
      pdfRegex.test(url) ||
      blobRegex.test(url) ||
      dataRegex.test(url) ||
      supabaseRegex.test(url)
    );
  }

  getPathUrl(): string {
    return this.pathUrl;
  }

  getAccessUrl(): string {
    return this.accessUrl;
  }

  /** 뷰어/추출용 URL (accessUrl과 동일, 호환용) */
  getUrl(): string {
    return this.accessUrl;
  }

  getFilename(): string {
    if (this.filename) return this.filename;
    const urlParts = this.accessUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1] || 'document.pdf';
    return lastPart.split('?')[0] || 'document.pdf';
  }

  toJSON(): PdfBlockProperties {
    return {
      pathUrl: this.pathUrl,
      accessUrl: this.accessUrl,
      ...(this.accessUrlExpiresAt != null && {
        accessUrlExpiresAt: this.accessUrlExpiresAt,
      }),
      filename: this.filename,
      pageCount: this.pageCount,
      sourceSummaryAccessLanguages: this.sourceSummaryAccessLanguages,
      sourceRawContentAccessGranted: this.sourceRawContentAccessGranted,
    };
  }

  equals(other: PdfBlockPropertiesVO): boolean {
    return (
      this.pathUrl === other.pathUrl &&
      this.accessUrl === other.accessUrl &&
      this.filename === other.filename &&
      this.pageCount === other.pageCount &&
      JSON.stringify(this.sourceSummaryAccessLanguages ?? []) ===
        JSON.stringify(other.sourceSummaryAccessLanguages ?? []) &&
      this.sourceRawContentAccessGranted === other.sourceRawContentAccessGranted
    );
  }

  updateAccessUrl(
    accessUrl: string,
    accessUrlExpiresAt?: string | null
  ): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.pathUrl,
      accessUrl,
      accessUrlExpiresAt ?? this.accessUrlExpiresAt,
      this.filename,
      this.pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  updateFilename(filename: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.pathUrl,
      this.accessUrl,
      this.accessUrlExpiresAt,
      filename,
      this.pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  updatePageCount(pageCount: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.pathUrl,
      this.accessUrl,
      this.accessUrlExpiresAt,
      this.filename,
      pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  isEmpty(): boolean {
    return this.accessUrl.trim().length === 0;
  }

  toString(): string {
    return this.filename || this.getFilename() || 'Untitled PDF';
  }
}
