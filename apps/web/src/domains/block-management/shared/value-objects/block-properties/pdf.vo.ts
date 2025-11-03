import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * PDF Block Properties Interface
 */
export interface PdfBlockProperties {
  url: string;
  title: string;
  pageCount?: number;
}

/**
 * PDF Block Properties Value Object
 *
 * PDF 블록의 속성을 관리하는 Value Object
 */
export class PdfBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly pageCount?: number
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.url !== 'string' || this.url.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'URL must be a non-empty string'
      );
    }

    if (typeof this.title !== 'string' || this.title.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Title must be a non-empty string'
      );
    }

    if (
      this.pageCount !== undefined &&
      (typeof this.pageCount !== 'number' || this.pageCount < 0)
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Page count must be a non-negative number'
      );
    }

    // PDF URL 형식 검증
    if (!this.isValidPdfUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid PDF URL format'
      );
    }
    return true;
  }

  /**
   * PDF URL 형식 검증
   */
  private isValidPdfUrl(url: string): boolean {
    const pdfRegex = /\.pdf$/i;
    return pdfRegex.test(url);
  }

  /**
   * 파일명 추출
   */
  getFilename(): string {
    const urlParts = this.url.split('/');
    return urlParts[urlParts.length - 1] || 'document.pdf';
  }

  /**
   * 파일 크기 추정 (URL에서 추출할 수 있는 경우)
   */
  getEstimatedSize(): string | null {
    // 실제 구현에서는 URL에서 파일 크기를 가져오거나 API를 통해 확인
    return null;
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(url, this.title, this.pageCount);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(this.url, title, this.pageCount);
  }

  /**
   * 페이지 수 업데이트
   */
  updatePageCount(pageCount: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(this.url, this.title, pageCount);
  }

  /**
   * 페이지 수 제거
   */
  removePageCount(): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(this.url, this.title);
  }

  /**
   * 페이지 수가 있는지 확인
   */
  hasPageCount(): boolean {
    return this.pageCount !== undefined && this.pageCount > 0;
  }

  /**
   * 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.title.trim().length > 0;
  }

  /**
   * PDF가 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.title.trim().length > 0;
  }

  equals(other: PdfBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.pageCount === other.pageCount
    );
  }

  toString(): string {
    return this.title || 'Untitled PDF';
  }

  toJSON(): PdfBlockProperties {
    return {
      url: this.url,
      title: this.title,
      pageCount: this.pageCount,
    };
  }

  /**
   * JSON 데이터로부터 PdfBlockPropertiesVO 생성
   */
  static fromJSON(data: PdfBlockProperties): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(data.url, data.title, data.pageCount);
  }

  /**
   * 기본 PDF 속성 생성
   */
  static createDefault(): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO('', '');
  }
}
