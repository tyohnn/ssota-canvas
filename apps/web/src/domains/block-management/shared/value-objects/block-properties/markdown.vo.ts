import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Markdown Block Properties Interface
 */
export interface MarkdownBlockProperties {
  content: string;
  title: string;
  format: 'markdown' | 'html';
}

/**
 * Markdown Block Properties Value Object
 *
 * 마크다운 블록의 속성을 관리하는 Value Object
 */
export class MarkdownBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly content: string,
    public readonly title: string,
    public readonly format: 'markdown' | 'html'
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.content !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Content must be a string'
      );
    }

    if (typeof this.title !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Title must be a string'
      );
    }

    if (!['markdown', 'html'].includes(this.format)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Format must be either "markdown" or "html"'
      );
    }
    return true;
  }

  /**
   * 콘텐츠 업데이트
   */
  updateContent(content: string): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO(content, this.title, this.format);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO(this.content, title, this.format);
  }

  /**
   * 포맷 변경
   */
  setFormat(format: 'markdown' | 'html'): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO(this.content, this.title, format);
  }

  /**
   * 마크다운인지 확인
   */
  isMarkdown(): boolean {
    return this.format === 'markdown';
  }

  /**
   * HTML인지 확인
   */
  isHtml(): boolean {
    return this.format === 'html';
  }

  /**
   * 콘텐츠가 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.content.trim().length === 0;
  }

  /**
   * 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.title.trim().length > 0;
  }

  equals(other: MarkdownBlockPropertiesVO): boolean {
    return (
      this.content === other.content &&
      this.title === other.title &&
      this.format === other.format
    );
  }

  toString(): string {
    return this.title || 'Untitled Markdown';
  }

  toJSON(): MarkdownBlockProperties {
    return {
      content: this.content,
      title: this.title,
      format: this.format,
    };
  }

  /**
   * JSON 데이터로부터 MarkdownBlockPropertiesVO 생성
   */
  static fromJSON(data: MarkdownBlockProperties): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO(data.content, data.title, data.format);
  }

  /**
   * 기본 마크다운 속성 생성
   */
  static createDefault(): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO('', '', 'markdown');
  }
}
