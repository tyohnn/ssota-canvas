/**
 * Link Block Properties Value Object
 *
 * URL 프리뷰 블록의 속성을 관리하는 Value Object
 * - 사용자가 입력한 URL과 자동으로 fetch된 메타데이터 포함
 * - 메타데이터는 에디터 패널에서 렌더링되지 않고, 블록 렌더링에만 사용됨
 */

import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Link Block Properties Interface
 *
 * 사용자가 입력한 URL과 자동으로 fetch된 오픈그래프 메타데이터
 * properties는 flat 유지 (tabs 래퍼 없음)
 */
export interface LinkBlockProperties {
  // 기본 정보
  url: string; // 사용자가 입력하는 URL

  // 오픈그래프 메타데이터 (자동 fetch, 에디터 패널에서 렌더링 안 함)
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  siteName?: string;
  domain?: string;
  faviconUrl?: string;
  author?: string;
  publishedAt?: string;
  pageType?: string;

  /** 스크린샷 (배열) */
  screenshot?: Array<{
    url: string;
    fullPage: boolean;
    capturedAt: string;
  }>;
  /** 이미지 목록 */
  images?: Array<{
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;
  /** 디자인 메타데이터 */
  design?: {
    colors: string[];
    fonts: string[];
    metadata: Record<string, unknown>;
  };

  /** 요약 (언어별, Source 도메인 또는 캐시) */
  summary?: Record<string, string>;
  /** 추출 마크다운 (Source 도메인 또는 캐시) */
  extract?: { markdown: string; extractedAt?: string };
}

/**
 * Link Block Properties Value Object
 *
 * URL 프리뷰 블록의 속성을 캡슐화하고 유효성을 검증
 */
export class LinkBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly ogTitle?: string,
    public readonly ogDescription?: string,
    public readonly ogImage?: string,
    public readonly siteName?: string,
    public readonly domain?: string,
    public readonly faviconUrl?: string,
    public readonly author?: string,
    public readonly publishedAt?: string,
    public readonly pageType?: string,
    public readonly screenshot?: LinkBlockProperties['screenshot'],
    public readonly images?: LinkBlockProperties['images'],
    public readonly design?: LinkBlockProperties['design'],
    public readonly summary?: LinkBlockProperties['summary'],
    public readonly extract?: LinkBlockProperties['extract']
  ) {
    super();
    this.validate();
  }

  /**
   * 기본값 생성
   * @returns 기본 속성을 가진 LinkBlockPropertiesVO 인스턴스
   */
  static createDefault(): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO('');
  }

  /**
   * JSON 데이터에서 VO 생성 (타입 안전성 보장)
   * @param data - JSON 데이터
   * @returns LinkBlockPropertiesVO 인스턴스
   */
  static fromJSON(data: LinkBlockProperties): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(
      data.url || '',
      data.ogTitle,
      data.ogDescription,
      data.ogImage,
      data.siteName,
      data.domain,
      data.faviconUrl,
      data.author,
      data.publishedAt,
      data.pageType,
      data.screenshot,
      data.images,
      data.design,
      data.summary,
      data.extract
    );
  }

  /**
   * 속성 유효성 검증
   * @throws Error - 유효하지 않은 속성이 있을 경우
   */
  protected validate(): boolean {
    // URL은 빈 문자열 허용 (생성 직후 상태)
    if (this.url && !this.isValidUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Invalid URL format'
      );
    }
    return true;
  }

  /**
   * URL 형식 검증
   * @param url - 검증할 URL
   * @returns URL이 유효한지 여부
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * JSON으로 직렬화
   * @returns LinkBlockProperties 객체
   */
  toJSON(): LinkBlockProperties {
    return {
      url: this.url,
      ogTitle: this.ogTitle,
      ogDescription: this.ogDescription,
      ogImage: this.ogImage,
      siteName: this.siteName,
      domain: this.domain,
      faviconUrl: this.faviconUrl,
      author: this.author,
      publishedAt: this.publishedAt,
      pageType: this.pageType,
      ...(this.screenshot && { screenshot: this.screenshot }),
      ...(this.images && { images: this.images }),
      ...(this.design && { design: this.design }),
      ...(this.summary && { summary: this.summary }),
      ...(this.extract && { extract: this.extract }),
    };
  }

  /**
   * 다른 VO와 비교
   * @param other - 비교할 VO
   * @returns 동일한지 여부
   */
  equals(other: LinkBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.ogTitle === other.ogTitle &&
      this.ogDescription === other.ogDescription &&
      this.ogImage === other.ogImage &&
      this.siteName === other.siteName &&
      this.domain === other.domain &&
      this.faviconUrl === other.faviconUrl &&
      this.author === other.author &&
      this.publishedAt === other.publishedAt &&
      this.pageType === other.pageType &&
      JSON.stringify(this.screenshot ?? []) ===
        JSON.stringify(other.screenshot ?? []) &&
      JSON.stringify(this.images ?? []) === JSON.stringify(other.images ?? []) &&
      JSON.stringify(this.design ?? {}) === JSON.stringify(other.design ?? {}) &&
      JSON.stringify(this.summary ?? {}) === JSON.stringify(other.summary ?? {}) &&
      JSON.stringify(this.extract ?? {}) === JSON.stringify(other.extract ?? {})
    );
  }

  /**
   * URL 업데이트 (불변성 유지)
   * @param url - 새로운 URL
   * @returns 새로운 LinkBlockPropertiesVO 인스턴스
   */
  updateUrl(url: string): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(
      url,
      this.ogTitle,
      this.ogDescription,
      this.ogImage,
      this.siteName,
      this.domain,
      this.faviconUrl,
      this.author,
      this.publishedAt,
      this.pageType,
      this.screenshot,
      this.images,
      this.design,
      this.summary,
      this.extract
    );
  }

  /**
   * 메타데이터 업데이트 (불변성 유지)
   * @param metadata - 메타데이터 객체
   * @returns 새로운 LinkBlockPropertiesVO 인스턴스
   */
  updateMetadata(metadata: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    siteName?: string;
    domain?: string;
    faviconUrl?: string;
    author?: string;
    publishedAt?: string;
    pageType?: string;
  }): LinkBlockPropertiesVO {
    return new LinkBlockPropertiesVO(
      this.url,
      metadata.ogTitle ?? this.ogTitle,
      metadata.ogDescription ?? this.ogDescription,
      metadata.ogImage ?? this.ogImage,
      metadata.siteName ?? this.siteName,
      metadata.domain ?? this.domain,
      metadata.faviconUrl ?? this.faviconUrl,
      metadata.author ?? this.author,
      metadata.publishedAt ?? this.publishedAt,
      metadata.pageType ?? this.pageType,
      this.screenshot,
      this.images,
      this.design,
      this.summary,
      this.extract
    );
  }

  /**
   * URL이 비어있는지 확인
   * @returns URL이 비어있는지 여부
   */
  isEmpty(): boolean {
    return this.url.trim().length === 0;
  }
}
