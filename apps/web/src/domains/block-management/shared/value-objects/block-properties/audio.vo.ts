import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Audio Block Properties Interface
 */
export interface AudioBlockProperties {
  url: string;
  title: string;
  duration?: number;
}

/**
 * Audio Block Properties Value Object
 *
 * 오디오 블록의 속성을 관리하는 Value Object
 */
export class AudioBlockPropertiesVO extends BlockPropertiesVO {
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

    // 오디오 URL 형식 검증
    if (!this.isValidAudioUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid audio URL format'
      );
    }
    return true;
  }

  /**
   * 오디오 URL 형식 검증
   */
  private isValidAudioUrl(url: string): boolean {
    const audioRegex = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
    return audioRegex.test(url);
  }

  /**
   * 파일명 추출
   */
  getFilename(): string {
    const urlParts = this.url.split('/');
    return urlParts[urlParts.length - 1] || 'audio.mp3';
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
  updateUrl(url: string): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(url, this.title, this.duration);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(this.url, title, this.duration);
  }

  /**
   * 지속 시간 업데이트
   */
  updateDuration(duration: number): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(this.url, this.title, duration);
  }

  /**
   * 지속 시간 제거
   */
  removeDuration(): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(this.url, this.title);
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
   * 오디오가 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.title.trim().length > 0;
  }

  equals(other: AudioBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.duration === other.duration
    );
  }

  toString(): string {
    return this.title || 'Untitled Audio';
  }

  toJSON(): AudioBlockProperties {
    return {
      url: this.url,
      title: this.title,
      duration: this.duration,
    };
  }

  /**
   * JSON 데이터로부터 AudioBlockPropertiesVO 생성
   */
  static fromJSON(data: AudioBlockProperties): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(data.url, data.title, data.duration);
  }

  /**
   * 기본 오디오 속성 생성
   */
  static createDefault(): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO('', '');
  }
}
