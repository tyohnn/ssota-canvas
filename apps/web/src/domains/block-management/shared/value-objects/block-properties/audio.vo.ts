/**
 * Audio Block Properties Value Object
 *
 * 오디오 블록의 속성을 정의하고 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';

/**
 * Audio Block Properties Interface
 */
export interface AudioBlockProperties {
  // 오디오 정보
  audioUrl: string; // Supabase Storage URL 또는 외부 URL
  url?: string; // source용 canonical URL (audioUrl과 동일, signed URL 분리 시 사용)
  filename?: string; // 업로드 파일명
  duration?: number; // 재생 시간 (초)
  fileSize?: number; // 파일 용량 (바이트)

  // Source 연동 (link/PDF와 동일)
  sourceSummaryAccessLanguages?: string[];
  sourceRawContentAccessGranted?: boolean;
}

/**
 * Audio Block Properties Value Object
 */
export class AudioBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly audioUrl: string,
    private readonly url?: string,
    private readonly filename?: string,
    private readonly duration?: number,
    private readonly fileSize?: number,
    private readonly sourceSummaryAccessLanguages?: string[],
    private readonly sourceRawContentAccessGranted?: boolean,
  ) {
    super();
  }

  /**
   * 기본값으로 AudioBlockPropertiesVO 생성
   */
  static createDefault(): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(
      '', // audioUrl
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  /**
   * JSON 데이터로부터 AudioBlockPropertiesVO 생성
   * @param data - JSON 데이터
   */
  static fromJSON(data: unknown): AudioBlockPropertiesVO {
    const safeData = (data as Partial<AudioBlockProperties>) ?? {};
    return new AudioBlockPropertiesVO(
      safeData.audioUrl ?? '',
      safeData.url,
      safeData.filename,
      safeData.duration,
      safeData.fileSize,
      safeData.sourceSummaryAccessLanguages,
      safeData.sourceRawContentAccessGranted,
    );
  }

  /**
   * 속성 유효성 검증
   */
  protected validate(): boolean {
    if (this.audioUrl === undefined) {
      return false;
    }
    return true;
  }

  /**
   * JSON으로 직렬화
   */
  toJSON(): AudioBlockProperties {
    return {
      audioUrl: this.audioUrl,
      ...(this.url !== undefined && { url: this.url }),
      ...(this.filename !== undefined && { filename: this.filename }),
      ...(this.duration !== undefined && { duration: this.duration }),
      ...(this.fileSize !== undefined && { fileSize: this.fileSize }),
      ...(this.sourceSummaryAccessLanguages !== undefined && {
        sourceSummaryAccessLanguages: this.sourceSummaryAccessLanguages,
      }),
      ...(this.sourceRawContentAccessGranted !== undefined && {
        sourceRawContentAccessGranted: this.sourceRawContentAccessGranted,
      }),
    };
  }

  /**
   * 다른 BlockPropertiesVO와 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof AudioBlockPropertiesVO)) {
      return false;
    }
    return (
      this.audioUrl === other.audioUrl &&
      this.url === other.url &&
      this.filename === other.filename &&
      this.duration === other.duration &&
      this.fileSize === other.fileSize &&
      JSON.stringify(this.sourceSummaryAccessLanguages ?? []) ===
        JSON.stringify(other.sourceSummaryAccessLanguages ?? []) &&
      this.sourceRawContentAccessGranted === other.sourceRawContentAccessGranted
    );
  }

  getAudioUrl(): string {
    return this.audioUrl;
  }

  getUrl(): string | undefined {
    return this.url;
  }

  getFilename(): string | undefined {
    return this.filename;
  }

  getDuration(): number | undefined {
    return this.duration;
  }

  getFileSize(): number | undefined {
    return this.fileSize;
  }

  /**
   * 재생 시간을 시:분:초 형식으로 변환
   */
  getFormattedDuration(): string {
    if (this.duration == null || this.duration < 0) return '—';
    const h = Math.floor(this.duration / 3600);
    const m = Math.floor((this.duration % 3600) / 60);
    const s = Math.floor(this.duration % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * 파일 용량을 사람이 읽기 쉬운 형식으로 변환
   */
  getFormattedFileSize(): string {
    if (this.fileSize == null || this.fileSize < 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i += 1;
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  getSourceSummaryAccessLanguages(): string[] | undefined {
    return this.sourceSummaryAccessLanguages;
  }

  getSourceRawContentAccessGranted(): boolean | undefined {
    return this.sourceRawContentAccessGranted;
  }
}
