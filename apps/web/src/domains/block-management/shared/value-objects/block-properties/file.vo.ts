import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * File Block Properties Interface
 */
export interface FileBlockProperties {
  url: string;
  filename: string;
  fileSize?: number;
}

/**
 * File Block Properties Value Object
 *
 * 파일 블록의 속성을 관리하는 Value Object
 */
export class FileBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly filename: string,
    public readonly fileSize?: number
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

    if (
      typeof this.filename !== 'string' ||
      this.filename.trim().length === 0
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Filename must be a non-empty string'
      );
    }

    if (
      this.fileSize !== undefined &&
      (typeof this.fileSize !== 'number' || this.fileSize < 0)
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'File size must be a non-negative number'
      );
    }
    return true;
  }

  /**
   * 파일 확장자 추출
   */
  getFileExtension(): string {
    const parts = this.filename.split('.');
    return parts.length > 1
      ? (parts[parts.length - 1]?.toLowerCase() ?? '')
      : '';
  }

  /**
   * 파일명에서 확장자 제거
   */
  getFilenameWithoutExtension(): string {
    const parts = this.filename.split('.');
    return parts.length > 1 ? parts.slice(0, -1).join('.') : this.filename;
  }

  /**
   * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
   */
  getFormattedFileSize(): string {
    if (!this.fileSize) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  /**
   * 파일 타입 확인
   */
  getFileType():
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'archive'
    | 'other' {
    const extension = this.getFileExtension();

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoExtensions = [
      'mp4',
      'webm',
      'ogg',
      'avi',
      'mov',
      'wmv',
      'flv',
      'mkv',
    ];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (documentExtensions.includes(extension)) return 'document';
    if (archiveExtensions.includes(extension)) return 'archive';

    return 'other';
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO(url, this.filename, this.fileSize);
  }

  /**
   * 파일명 업데이트
   */
  updateFilename(filename: string): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO(this.url, filename, this.fileSize);
  }

  /**
   * 파일 크기 업데이트
   */
  updateFileSize(fileSize: number): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO(this.url, this.filename, fileSize);
  }

  /**
   * 파일 크기 제거
   */
  removeFileSize(): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO(this.url, this.filename);
  }

  /**
   * 파일 크기가 있는지 확인
   */
  hasFileSize(): boolean {
    return this.fileSize !== undefined && this.fileSize > 0;
  }

  /**
   * 파일이 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.filename.trim().length > 0;
  }

  equals(other: FileBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.filename === other.filename &&
      this.fileSize === other.fileSize
    );
  }

  toString(): string {
    return this.filename || 'Untitled File';
  }

  toJSON(): FileBlockProperties {
    return {
      url: this.url,
      filename: this.filename,
      fileSize: this.fileSize,
    };
  }

  /**
   * JSON 데이터로부터 FileBlockPropertiesVO 생성
   */
  static fromJSON(data: FileBlockProperties): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO(data.url, data.filename, data.fileSize);
  }

  /**
   * 기본 파일 속성 생성
   */
  static createDefault(): FileBlockPropertiesVO {
    return new FileBlockPropertiesVO('', '');
  }
}
