/**
 * Image Block Properties Value Object
 *
 * 이미지 블록의 속성을 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';

/**
 * Image Block Properties Interface (프론트엔드 공유용)
 */
export interface ImageBlockProperties {
  url: string;
  alt: string;
  caption?: string;
}

/**
 * Image Block Properties Value Object
 */
export class ImageBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly url: string,
    private readonly alt: string,
    private readonly caption: string
  ) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): ImageBlockPropertiesVO {
    return new ImageBlockPropertiesVO('', '', '');
  }

  /**
   * JSON에서 생성
   */
  static fromJSON(data: ImageBlockProperties): ImageBlockPropertiesVO {
    return new ImageBlockPropertiesVO(
      data.url || '',
      data.alt || '',
      data.caption || ''
    );
  }

  /**
   * Properties 검증
   */
  validate(): boolean {
    return (
      typeof this.url === 'string' &&
      typeof this.alt === 'string' &&
      typeof this.caption === 'string'
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): ImageBlockProperties {
    return {
      url: this.url,
      alt: this.alt,
      caption: this.caption || undefined,
    };
  }

  /**
   * 값 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof ImageBlockPropertiesVO)) {
      return false;
    }

    return (
      this.url === other.url &&
      this.alt === other.alt &&
      this.caption === other.caption
    );
  }

  // Getters
  getUrl(): string {
    return this.url;
  }

  getAlt(): string {
    return this.alt;
  }

  getCaption(): string {
    return this.caption;
  }
}
