/**
 * PDF Block Properties Value Object
 *
 * PDF 문서를 표시하는 블록의 속성을 관리하는 Value Object
 */

import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

export interface PdfBlockProperties {
  // 기본 정보
  url: string;
  filename?: string;
  pageCount?: number;

  // Source 연동 (link/youtube와 동일)
  sourceSummaryAccessLanguages?: string[];
  sourceRawContentAccessGranted?: boolean;
}

export class PdfBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
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
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  static fromJSON(data: unknown): PdfBlockPropertiesVO {
    const safeData = (data as Partial<PdfBlockProperties>) ?? {};
    return new PdfBlockPropertiesVO(
      safeData.url || '',
      safeData.filename,
      safeData.pageCount,
      safeData.sourceSummaryAccessLanguages,
      safeData.sourceRawContentAccessGranted,
    );
  }

  protected validate(): boolean {
    if (this.url && !this.isValidPdfUrl(this.url)) {
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
    // Supabase storage URLs may not end in .pdf
    const supabaseRegex = /supabase/i;
    return (
      pdfRegex.test(url) ||
      blobRegex.test(url) ||
      dataRegex.test(url) ||
      supabaseRegex.test(url)
    );
  }

  getFilename(): string {
    if (this.filename) return this.filename;
    const urlParts = this.url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || 'document.pdf';
    return lastPart.split('?')[0] || 'document.pdf';
  }

  toJSON(): PdfBlockProperties {
    return {
      url: this.url,
      filename: this.filename,
      pageCount: this.pageCount,
      sourceSummaryAccessLanguages: this.sourceSummaryAccessLanguages,
      sourceRawContentAccessGranted: this.sourceRawContentAccessGranted,
    };
  }

  equals(other: PdfBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.filename === other.filename &&
      this.pageCount === other.pageCount &&
      JSON.stringify(this.sourceSummaryAccessLanguages ?? []) ===
        JSON.stringify(other.sourceSummaryAccessLanguages ?? []) &&
      this.sourceRawContentAccessGranted === other.sourceRawContentAccessGranted
    );
  }

  updateUrl(url: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      url,
      this.filename,
      this.pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  updateFilename(filename: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      filename,
      this.pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  updatePageCount(pageCount: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      this.filename,
      pageCount,
      this.sourceSummaryAccessLanguages,
      this.sourceRawContentAccessGranted,
    );
  }

  isEmpty(): boolean {
    return this.url.trim().length === 0;
  }

  toString(): string {
    return this.filename || this.getFilename() || 'Untitled PDF';
  }
}
