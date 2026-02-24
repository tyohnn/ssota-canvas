/**
 * Audio Block Properties Value Object
 *
 * - pathUrl: Supabase 스토리지 경로 (만료 없음). 외부 URL일 땐 ''.
 * - accessUrl: 뷰어/추출에 사용하는 URL (Signed URL 또는 외부 URL).
 */

import { BlockPropertiesVO } from './base.vo';

export interface AudioBlockProperties {
  pathUrl: string;
  accessUrl: string;
  accessUrlExpiresAt?: string | null;
  filename?: string;
  duration?: number;
  fileSize?: number;

  sourceSummaryAccessLanguages?: string[];
  sourceRawContentAccessGranted?: boolean;
}

export class AudioBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly pathUrl: string,
    private readonly accessUrl: string,
    private readonly accessUrlExpiresAt: string | null | undefined,
    private readonly filename: string | undefined,
    private readonly duration: number | undefined,
    private readonly fileSize: number | undefined,
    private readonly sourceSummaryAccessLanguages: string[] | undefined,
    private readonly sourceRawContentAccessGranted: boolean | undefined,
  ) {
    super();
  }

  static createDefault(): AudioBlockPropertiesVO {
    return new AudioBlockPropertiesVO(
      '',
      '',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  static fromJSON(data: unknown): AudioBlockPropertiesVO {
    const safeData = (data as Partial<AudioBlockProperties>) ?? {};
    const pathUrl = safeData.pathUrl ?? '';
    const accessUrl =
      safeData.accessUrl ??
      (safeData as { audioUrl?: string }).audioUrl ??
      (safeData as { url?: string }).url ??
      '';
    return new AudioBlockPropertiesVO(
      pathUrl,
      accessUrl,
      safeData.accessUrlExpiresAt,
      safeData.filename,
      safeData.duration,
      safeData.fileSize,
      safeData.sourceSummaryAccessLanguages,
      safeData.sourceRawContentAccessGranted,
    );
  }

  protected validate(): boolean {
    return true;
  }

  toJSON(): AudioBlockProperties {
    return {
      pathUrl: this.pathUrl,
      accessUrl: this.accessUrl,
      ...(this.accessUrlExpiresAt != null && {
        accessUrlExpiresAt: this.accessUrlExpiresAt,
      }),
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

  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof AudioBlockPropertiesVO)) {
      return false;
    }
    return (
      this.pathUrl === other.pathUrl &&
      this.accessUrl === other.accessUrl &&
      this.filename === other.filename &&
      this.duration === other.duration &&
      this.fileSize === other.fileSize &&
      JSON.stringify(this.sourceSummaryAccessLanguages ?? []) ===
        JSON.stringify(other.sourceSummaryAccessLanguages ?? []) &&
      this.sourceRawContentAccessGranted === other.sourceRawContentAccessGranted
    );
  }

  getPathUrl(): string {
    return this.pathUrl;
  }

  getAccessUrl(): string {
    return this.accessUrl;
  }

  /** 호환용: accessUrl과 동일 */
  getAudioUrl(): string {
    return this.accessUrl;
  }

  getUrl(): string {
    return this.accessUrl;
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

  getSourceSummaryAccessLanguages(): string[] | undefined {
    return this.sourceSummaryAccessLanguages;
  }

  getSourceRawContentAccessGranted(): boolean | undefined {
    return this.sourceRawContentAccessGranted;
  }

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
}
