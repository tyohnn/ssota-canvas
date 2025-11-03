import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Link Block Properties Interface
 */
export interface LinkBlockProperties {
  url: string;
  title: string;
  description?: string;
}

/**
 * Link Block Properties Value Object
 *
 * 링크 블록의 속성을 관리하는 Value Object
 */
export class LinkBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly description?: string
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
      this.description !== undefined &&
      typeof this.description !== 'string'
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Description must be a string'
      );
    }

    // URL 형식 검증
    if (!this.isValidUrl(this.url)) {
      throw new BlockManagementError('INVALID_MEDIA_URL', 'Invalid URL format');
    }
    return true;
  }

  /**
   * URL 형식 검증
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // http:// 또는 https://가 없는 경우 추가해서 다시 시도
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        try {
          new URL(`https://${url}`);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * 정규화된 URL 반환 (프로토콜이 없는 경우 https:// 추가)
   */
  getNormalizedUrl(): string {
    if (this.url.startsWith('http://') || this.url.startsWith('https://')) {
      return this.url;
    }
    return `https://${this.url}`;
  }

  /**
   * 도메인 추출
   */
  getDomain(): string {
    try {
      const url = new URL(this.getNormalizedUrl());
      return url.hostname;
    } catch {
      return '';
    }
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(url, this.title, this.description);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(this.url, title, this.description);
  }

  /**
   * 설명 업데이트
   */
  updateDescription(description: string): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(this.url, this.title, description);
  }

  /**
   * 설명 제거
   */
  removeDescription(): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(this.url, this.title);
  }

  /**
   * 설명이 있는지 확인
   */
  hasDescription(): boolean {
    return this.description !== undefined && this.description.trim().length > 0;
  }

  /**
   * 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.title.trim().length > 0;
  }

  /**
   * 링크가 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.title.trim().length > 0;
  }

  equals(other: LinkBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.description === other.description
    );
  }

  toString(): string {
    return this.title || 'Untitled Link';
  }

  toJSON(): LinkBlockProperties {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
    };
  }

  /**
   * JSON 데이터로부터 LinkBlockPropertiesVO 생성
   */
  static fromJSON(data: LinkBlockProperties): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(data.url, data.title, data.description);
  }

  /**
   * 기본 링크 속성 생성
   */
  static createDefault(): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO('', '');
  }
}
