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
  url?: string; // source용 canonical URL (audioUrl과 동일 값)
  filename?: string; // 업로드 파일명

  // 표시 옵션
  title: string; // 오디오 제목
  artist: string; // 아티스트/화자

  // 재생 옵션
  playbackRate: number; // 재생 속도 (0.5 ~ 2.0)
  volume: number; // 볼륨 (0.0 ~ 1.0)

  // 접근성 (deprecated - raw_content에서 가져옴)
  transcript: string; // 음성 텍스트 변환 결과 (STT)

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
    private readonly title: string,
    private readonly artist: string,
    private readonly playbackRate: number,
    private readonly volume: number,
    private readonly transcript: string,
    private readonly url?: string,
    private readonly filename?: string,
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
      '', // title
      '', // artist
      1.0, // playbackRate
      0.8, // volume
      '', // transcript
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
      safeData.title ?? '',
      safeData.artist ?? '',
      safeData.playbackRate ?? 1.0,
      safeData.volume ?? 0.8,
      safeData.transcript ?? '',
      safeData.url,
      safeData.filename,
      safeData.sourceSummaryAccessLanguages,
      safeData.sourceRawContentAccessGranted,
    );
  }

  /**
   * 속성 유효성 검증
   */
  protected validate(): boolean {
    // audioUrl은 필수 (빈 문자열 허용 - 초기 생성 시)
    if (this.audioUrl === undefined) {
      return false;
    }

    // playbackRate 범위 검증
    if (this.playbackRate < 0.5 || this.playbackRate > 2.0) {
      return false;
    }

    // volume 범위 검증
    if (this.volume < 0 || this.volume > 1.0) {
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
      title: this.title,
      artist: this.artist,
      playbackRate: this.playbackRate,
      volume: this.volume,
      transcript: this.transcript,
      ...(this.url !== undefined && { url: this.url }),
      ...(this.filename !== undefined && { filename: this.filename }),
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
      this.title === other.title &&
      this.artist === other.artist &&
      this.playbackRate === other.playbackRate &&
      this.volume === other.volume &&
      this.transcript === other.transcript &&
      this.url === other.url &&
      this.filename === other.filename &&
      JSON.stringify(this.sourceSummaryAccessLanguages ?? []) ===
        JSON.stringify(other.sourceSummaryAccessLanguages ?? []) &&
      this.sourceRawContentAccessGranted === other.sourceRawContentAccessGranted
    );
  }

  // Getter 메서드들
  getAudioUrl(): string {
    return this.audioUrl;
  }

  getTitle(): string {
    return this.title;
  }

  getArtist(): string {
    return this.artist;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  getVolume(): number {
    return this.volume;
  }

  getTranscript(): string {
    return this.transcript;
  }

  getUrl(): string | undefined {
    return this.url;
  }

  getFilename(): string | undefined {
    return this.filename;
  }

  getSourceSummaryAccessLanguages(): string[] | undefined {
    return this.sourceSummaryAccessLanguages;
  }

  getSourceRawContentAccessGranted(): boolean | undefined {
    return this.sourceRawContentAccessGranted;
  }
}
