import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Page Mention Block Properties Interface
 */
export interface PageMentionBlockProperties {
  pageId: string;
  pageTitle: string;
}

/**
 * Page Mention Block Properties Value Object
 *
 * 페이지 멘션 블록의 속성을 관리하는 Value Object
 */
export class PageMentionBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly pageId: string,
    public readonly pageTitle: string
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.pageId !== 'string' || this.pageId.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Page ID must be a non-empty string'
      );
    }

    if (
      typeof this.pageTitle !== 'string' ||
      this.pageTitle.trim().length === 0
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Page title must be a non-empty string'
      );
    }

    // UUID 형식 검증 (기본적인 형식만 확인)
    if (!this.isValidPageId(this.pageId)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Invalid page ID format'
      );
    }
    return true;
  }

  /**
   * 페이지 ID 형식 검증 (UUID 형식)
   */
  private isValidPageId(pageId: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(pageId);
  }

  /**
   * 페이지 ID 업데이트
   */
  updatePageId(pageId: string): PageMentionBlockPropertiesVO {
    return new PageMentionBlockPropertiesVO(pageId, this.pageTitle);
  }

  /**
   * 페이지 제목 업데이트
   */
  updatePageTitle(pageTitle: string): PageMentionBlockPropertiesVO {
    return new PageMentionBlockPropertiesVO(this.pageId, pageTitle);
  }

  /**
   * 페이지 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.pageTitle.trim().length > 0;
  }

  /**
   * 페이지 멘션이 유효한지 확인
   */
  isValid(): boolean {
    return this.pageId.trim().length > 0 && this.pageTitle.trim().length > 0;
  }

  /**
   * 페이지 링크 생성 (앱 내부 링크)
   */
  getPageLink(): string {
    return `/pages/${this.pageId}`;
  }

  /**
   * 멘션 표시 텍스트 생성
   */
  getMentionText(): string {
    return `[[${this.pageTitle}]]`;
  }

  equals(other: PageMentionBlockPropertiesVO): boolean {
    return this.pageId === other.pageId && this.pageTitle === other.pageTitle;
  }

  toString(): string {
    return this.pageTitle || 'Untitled Page';
  }

  toJSON(): PageMentionBlockProperties {
    return {
      pageId: this.pageId,
      pageTitle: this.pageTitle,
    };
  }

  /**
   * JSON 데이터로부터 PageMentionBlockPropertiesVO 생성
   */
  static fromJSON(
    data: PageMentionBlockProperties
  ): PageMentionBlockPropertiesVO {
    return new PageMentionBlockPropertiesVO(data.pageId, data.pageTitle);
  }

  /**
   * 기본 페이지 멘션 속성 생성
   */
  static createDefault(): PageMentionBlockPropertiesVO {
    return new PageMentionBlockPropertiesVO('', '');
  }
}
