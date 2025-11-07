/**
 * PDF Block Properties Value Object
 *
 * PDF 문서를 표시하는 블록의 속성을 관리하는 Value Object
 * - 페이지 네비게이션, 확대/축소, 검색, 주석 기능 지원
 * - Image Block과 유사한 구조로 파일 업로드 및 URL 관리
 */

import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * PDF Block Properties Interface
 *
 * PDF 문서 표시를 위한 속성들
 */
export interface PdfBlockProperties {
  // 기본 정보
  url: string; // PDF 파일 URL (업로드된 파일 또는 외부 URL)
  filename?: string; // 파일명
  pageCount?: number; // 총 페이지 수 (자동 추출)

  // 뷰어 상태
  currentPage: number; // 현재 페이지 (1부터 시작)
  zoom: number; // 확대/축소 레벨 (100% = 1.0)

  // 표시 옵션
  showPageNav?: boolean; // 페이지 네비게이션 표시 여부
  showToolbar?: boolean; // 툴바 표시 여부
  enableAnnotations?: boolean; // 주석 기능 활성화 여부
}

/**
 * PDF Block Properties Value Object
 *
 * PDF 블록의 속성을 캡슐화하고 유효성을 검증
 */
export class PdfBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly filename: string | undefined,
    public readonly pageCount: number | undefined,
    public readonly currentPage: number,
    public readonly zoom: number,
    public readonly showPageNav: boolean | undefined,
    public readonly showToolbar: boolean | undefined,
    public readonly enableAnnotations: boolean | undefined
  ) {
    super();
    this.validate();
  }

  /**
   * 기본값 생성
   * @returns 기본 속성을 가진 PdfBlockPropertiesVO 인스턴스
   */
  static createDefault(): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      '', // url
      undefined, // filename
      undefined, // pageCount
      1, // currentPage (1부터 시작)
      1.0, // zoom (100%)
      true, // showPageNav
      true, // showToolbar
      false // enableAnnotations
    );
  }

  /**
   * JSON 데이터에서 VO 생성 (타입 안전성 보장)
   * @param data - JSON 데이터
   * @returns PdfBlockPropertiesVO 인스턴스
   */
  static fromJSON(data: unknown): PdfBlockPropertiesVO {
    const safeData = (data as Partial<PdfBlockProperties>) ?? {};
    return new PdfBlockPropertiesVO(
      safeData.url || '',
      safeData.filename,
      safeData.pageCount,
      safeData.currentPage ?? 1,
      safeData.zoom ?? 1.0,
      safeData.showPageNav ?? true,
      safeData.showToolbar ?? true,
      safeData.enableAnnotations ?? false
    );
  }

  /**
   * 속성 유효성 검증
   * @throws Error - 유효하지 않은 속성이 있을 경우
   */
  protected validate(): boolean {
    // URL은 빈 문자열 허용 (생성 직후 상태)
    if (this.url && !this.isValidPdfUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid PDF URL format'
      );
    }

    // currentPage 검증
    if (typeof this.currentPage !== 'number' || this.currentPage < 1) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Current page must be a positive number'
      );
    }

    // zoom 검증
    if (typeof this.zoom !== 'number' || this.zoom <= 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Zoom must be a positive number'
      );
    }

    // pageCount 검증 (있는 경우)
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

  /**
   * PDF URL 형식 검증
   * @param url - 검증할 URL
   * @returns URL이 유효한 PDF URL인지 여부
   */
  private isValidPdfUrl(url: string): boolean {
    // .pdf 확장자 또는 Blob URL 또는 Data URL
    const pdfRegex = /\.pdf(\?.*)?$/i;
    const blobRegex = /^blob:/;
    const dataRegex = /^data:application\/pdf/;
    return pdfRegex.test(url) || blobRegex.test(url) || dataRegex.test(url);
  }

  /**
   * 파일명 추출 또는 반환
   * @returns 파일명
   */
  getFilename(): string {
    if (this.filename) {
      return this.filename;
    }
    const urlParts = this.url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || 'document.pdf';
    // 쿼리 파라미터 제거
    return lastPart.split('?')[0];
  }

  /**
   * JSON으로 직렬화
   * @returns PdfBlockProperties 객체
   */
  toJSON(): PdfBlockProperties {
    return {
      url: this.url,
      filename: this.filename,
      pageCount: this.pageCount,
      currentPage: this.currentPage,
      zoom: this.zoom,
      showPageNav: this.showPageNav,
      showToolbar: this.showToolbar,
      enableAnnotations: this.enableAnnotations,
    };
  }

  /**
   * 다른 VO와 비교
   * @param other - 비교할 VO
   * @returns 동일한지 여부
   */
  equals(other: PdfBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.filename === other.filename &&
      this.pageCount === other.pageCount &&
      this.currentPage === other.currentPage &&
      this.zoom === other.zoom &&
      this.showPageNav === other.showPageNav &&
      this.showToolbar === other.showToolbar &&
      this.enableAnnotations === other.enableAnnotations
    );
  }

  /**
   * URL 업데이트 (불변성 유지)
   * @param url - 새로운 URL
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  updateUrl(url: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      url,
      this.filename,
      this.pageCount,
      this.currentPage,
      this.zoom,
      this.showPageNav,
      this.showToolbar,
      this.enableAnnotations
    );
  }

  /**
   * 현재 페이지 업데이트 (불변성 유지)
   * @param page - 새로운 페이지 번호
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  updateCurrentPage(page: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      this.filename,
      this.pageCount,
      page,
      this.zoom,
      this.showPageNav,
      this.showToolbar,
      this.enableAnnotations
    );
  }

  /**
   * 확대/축소 레벨 업데이트 (불변성 유지)
   * @param zoom - 새로운 확대/축소 레벨
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  updateZoom(zoom: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      this.filename,
      this.pageCount,
      this.currentPage,
      zoom,
      this.showPageNav,
      this.showToolbar,
      this.enableAnnotations
    );
  }

  /**
   * 페이지 수 업데이트 (불변성 유지)
   * @param pageCount - 총 페이지 수
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  updatePageCount(pageCount: number): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      this.filename,
      pageCount,
      this.currentPage,
      this.zoom,
      this.showPageNav,
      this.showToolbar,
      this.enableAnnotations
    );
  }

  /**
   * 파일명 업데이트 (불변성 유지)
   * @param filename - 파일명
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  updateFilename(filename: string): PdfBlockPropertiesVO {
    return new PdfBlockPropertiesVO(
      this.url,
      filename,
      this.pageCount,
      this.currentPage,
      this.zoom,
      this.showPageNav,
      this.showToolbar,
      this.enableAnnotations
    );
  }

  /**
   * URL이 비어있는지 확인
   * @returns URL이 비어있는지 여부
   */
  isEmpty(): boolean {
    return this.url.trim().length === 0;
  }

  /**
   * 페이지 수가 있는지 확인
   * @returns 페이지 수가 있는지 여부
   */
  hasPageCount(): boolean {
    return this.pageCount !== undefined && this.pageCount > 0;
  }

  /**
   * 다음 페이지로 이동 가능한지 확인
   * @returns 다음 페이지로 이동 가능한지 여부
   */
  canGoToNextPage(): boolean {
    return this.pageCount !== undefined && this.currentPage < this.pageCount;
  }

  /**
   * 이전 페이지로 이동 가능한지 확인
   * @returns 이전 페이지로 이동 가능한지 여부
   */
  canGoToPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  /**
   * 다음 페이지로 이동
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  goToNextPage(): PdfBlockPropertiesVO {
    if (!this.canGoToNextPage()) {
      return this;
    }
    return this.updateCurrentPage(this.currentPage + 1);
  }

  /**
   * 이전 페이지로 이동
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  goToPreviousPage(): PdfBlockPropertiesVO {
    if (!this.canGoToPreviousPage()) {
      return this;
    }
    return this.updateCurrentPage(this.currentPage - 1);
  }

  /**
   * 확대
   * @param step - 확대 단계 (기본값: 0.25)
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  zoomIn(step: number = 0.25): PdfBlockPropertiesVO {
    const newZoom = Math.min(this.zoom + step, 3.0); // 최대 300%
    return this.updateZoom(newZoom);
  }

  /**
   * 축소
   * @param step - 축소 단계 (기본값: 0.25)
   * @returns 새로운 PdfBlockPropertiesVO 인스턴스
   */
  zoomOut(step: number = 0.25): PdfBlockPropertiesVO {
    const newZoom = Math.max(this.zoom - step, 0.5); // 최소 50%
    return this.updateZoom(newZoom);
  }

  /**
   * 문자열 표현
   * @returns PDF 블록의 문자열 표현
   */
  toString(): string {
    return this.filename || this.getFilename() || 'Untitled PDF';
  }
}
