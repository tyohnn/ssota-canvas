import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * YouTube Block Properties Interface
 */
export interface YoutubeBlockProperties {
  url: string;
  title: string;
  description?: string;
}

/**
 * YouTube Block Properties Value Object
 *
 * YouTube 블록의 속성을 관리하는 Value Object
 */
export class YoutubeBlockPropertiesVO extends BlockPropertiesVO {
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

    // YouTube URL 형식 검증
    if (!this.isValidYouTubeUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid YouTube URL format'
      );
    }
    return true;
  }

  /**
   * YouTube URL 형식 검증
   */
  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }

  /**
   * YouTube 비디오 ID 추출
   */
  getVideoId(): string | undefined {
    const match = this.url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : undefined;
  }

  /**
   * 임베드 URL 생성
   */
  getEmbedUrl(): string {
    const videoId = this.getVideoId();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : this.url;
  }

  /**
   * 썸네일 URL 생성
   */
  getThumbnailUrl(): string | null {
    const videoId = this.getVideoId();
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(url, this.title, this.description);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(this.url, title, this.description);
  }

  /**
   * 설명 업데이트
   */
  updateDescription(description: string): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(this.url, this.title, description);
  }

  /**
   * 설명 제거
   */
  removeDescription(): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(this.url, this.title);
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

  equals(other: YoutubeBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.description === other.description
    );
  }

  toString(): string {
    return this.title || 'Untitled YouTube Video';
  }

  toJSON(): YoutubeBlockProperties {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
    };
  }

  /**
   * JSON 데이터로부터 YoutubeBlockPropertiesVO 생성
   */
  static fromJSON(data: YoutubeBlockProperties): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(data.url, data.title, data.description);
  }

  /**
   * 기본 YouTube 속성 생성
   */
  static createDefault(): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO('', '');
  }
}
