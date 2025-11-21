import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Video Block Properties Interface
 */
export interface VideoBlockProperties {
  url: string;
  title: string;
  duration?: number;
}

/**
 * Video Block Properties Value Object
 *
 * 비디오 블록의 속성을 관리하는 Value Object
 */
export class VideoBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly duration?: number
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
      this.duration !== undefined &&
      (typeof this.duration !== 'number' || this.duration < 0)
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Duration must be a non-negative number'
      );
    }

    // 비디오 URL 형식 검증
    if (!this.isValidVideoUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid video URL format'
      );
    }
    return true;
  }

  /**
   * 비디오 URL 형식 검증
   */
  private isValidVideoUrl(url: string): boolean {
    const videoRegex = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
    return videoRegex.test(url);
  }

  /**
   * 파일명 추출
   */
  getFilename(): string {
    const urlParts = this.url.split('/');
    return urlParts[urlParts.length - 1] || 'video.mp4';
  }

  /**
   * 파일 확장자 추출
   */
  getFileExtension(): string {
    const filename = this.getFilename();
    const parts = filename.split('.');
    return parts.length > 1
      ? (parts[parts.length - 1]?.toLowerCase() ?? '')
      : '';
  }

  /**
   * 지속 시간을 시:분:초 형식으로 변환
   */
  getFormattedDuration(): string {
    if (!this.duration) return 'Unknown';

    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = Math.floor(this.duration % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO(url, this.title, this.duration);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO(this.url, title, this.duration);
  }

  /**
   * 지속 시간 업데이트
   */
  updateDuration(duration: number): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO(this.url, this.title, duration);
  }

  /**
   * 지속 시간 제거
   */
  removeDuration(): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO(this.url, this.title);
  }

  /**
   * 지속 시간이 있는지 확인
   */
  hasDuration(): boolean {
    return this.duration !== undefined && this.duration > 0;
  }

  /**
   * 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.title.trim().length > 0;
  }

  /**
   * 비디오가 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.title.trim().length > 0;
  }

  equals(other: VideoBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.duration === other.duration
    );
  }

  toString(): string {
    return this.title || 'Untitled Video';
  }

  toJSON(): VideoBlockProperties {
    return {
      url: this.url,
      title: this.title,
      duration: this.duration,
    };
  }

  /**
   * JSON 데이터로부터 VideoBlockPropertiesVO 생성
   */
  static fromJSON(data: VideoBlockProperties): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO(data.url, data.title, data.duration);
  }

  /**
   * 기본 비디오 속성 생성
   */
  static createDefault(): VideoBlockPropertiesVO {
    return new VideoBlockPropertiesVO('', '');
  }
}
