/**
 * Image Block Properties Value Object
 *
 * 이미지 블록의 속성을 정의하고 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';
import type { AspectRatio, ObjectFit, ImageSource } from './common-types';

/**
 * Image Block Properties Interface
 */
export interface ImageBlockProperties {
  // 이미지 정보
  imageUrl: string; // Supabase Storage URL 또는 Unsplash URL
  imageSource: ImageSource; // 이미지 출처

  // 스타일
  objectFit: ObjectFit;

  // 캡션 (항상 하단에 작게 표시)
  caption?: string;

  // 접근성
  alt?: string; // 대체 텍스트

  // Unsplash 저작권 정보 (imageSource가 'unsplash'일 때만 사용)
  unsplashAuthorName?: string; // Unsplash 저자 이름
  unsplashAuthorLink?: string; // Unsplash 저자 프로필 링크 (UTM 포함)
}

/**
 * Image Block Properties Value Object
 */
export class ImageBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly imageUrl: string,
    private readonly imageSource: ImageSource,
    private readonly objectFit: ObjectFit,
    private readonly caption: string | undefined,
    private readonly alt: string | undefined,
    private readonly unsplashAuthorName: string | undefined,
    private readonly unsplashAuthorLink: string | undefined
  ) {
    super();
  }

  /**
   * 기본값으로 ImageBlockPropertiesVO 생성
   */
  static createDefault(): ImageBlockPropertiesVO {
    return new ImageBlockPropertiesVO(
      '', // imageUrl
      'user-upload', // imageSource
      'contain', // objectFit
      '', // caption
      '', // alt
      undefined, // unsplashAuthorName
      undefined // unsplashAuthorLink
    );
  }

  /**
   * JSON 데이터로부터 ImageBlockPropertiesVO 생성
   * @param data - JSON 데이터
   */
  static fromJSON(data: unknown): ImageBlockPropertiesVO {
    const safeData = (data as Partial<ImageBlockProperties>) ?? {};
    return new ImageBlockPropertiesVO(
      safeData.imageUrl ?? '',
      safeData.imageSource ?? 'user-upload',
      safeData.objectFit ?? 'contain',
      safeData.caption ?? '',
      safeData.alt ?? '',
      safeData.unsplashAuthorName,
      safeData.unsplashAuthorLink
    );
  }

  /**
   * 속성 유효성 검증
   */
  protected validate(): boolean {
    // imageUrl은 필수 (빈 문자열 허용 - 초기 생성 시)
    if (this.imageUrl === undefined) {
      return false;
    }

    // objectFit 검증
    const validObjectFits: ObjectFit[] = ['contain', 'cover', 'fill'];
    if (!validObjectFits.includes(this.objectFit)) {
      return false;
    }

    return true;
  }

  /**
   * JSON으로 직렬화
   */
  toJSON(): ImageBlockProperties {
    return {
      imageUrl: this.imageUrl,
      imageSource: this.imageSource,
      objectFit: this.objectFit,
      caption: this.caption,
      alt: this.alt,
      unsplashAuthorName: this.unsplashAuthorName,
      unsplashAuthorLink: this.unsplashAuthorLink,
    };
  }

  /**
   * 다른 BlockPropertiesVO와 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof ImageBlockPropertiesVO)) {
      return false;
    }
    return (
      this.imageUrl === other.imageUrl &&
      this.imageSource === other.imageSource &&
      this.objectFit === other.objectFit &&
      this.caption === other.caption &&
      this.alt === other.alt &&
      this.unsplashAuthorName === other.unsplashAuthorName &&
      this.unsplashAuthorLink === other.unsplashAuthorLink
    );
  }

  // Getter 메서드들
  getImageUrl(): string {
    return this.imageUrl;
  }

  getImageSource(): ImageSource {
    return this.imageSource;
  }

  getObjectFit(): ObjectFit {
    return this.objectFit;
  }

  getCaption(): string | undefined {
    return this.caption;
  }

  getAlt(): string | undefined {
    return this.alt;
  }

  getUnsplashAuthorName(): string | undefined {
    return this.unsplashAuthorName;
  }

  getUnsplashAuthorLink(): string | undefined {
    return this.unsplashAuthorLink;
  }
}
