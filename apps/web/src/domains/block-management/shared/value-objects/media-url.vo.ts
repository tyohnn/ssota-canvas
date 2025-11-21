import { BlockManagementError } from '../errors/block-management.error';

/**
 * MediaURL Value Object
 *
 * 미디어 파일 URL의 유효성을 검증하고 파일 정보를 캡슐화
 */
export class MediaURL {
  private readonly _value: string;
  private readonly _fileType: 'image' | 'file';
  private readonly _maxSize: number; // bytes

  constructor(value: string, fileType: 'image' | 'file' = 'file') {
    if (!this.isValidUrl(value)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid media URL format'
      );
    }

    this._value = value;
    this._fileType = fileType;
    this._maxSize = fileType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for files
  }

  get value(): string {
    return this._value;
  }

  get fileType(): 'image' | 'file' {
    return this._fileType;
  }

  get maxSize(): number {
    return this._maxSize;
  }

  private isValidUrl(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * 파일 타입 검증
   *
   * @param expectedType - 예상 파일 타입
   * @returns 검증 결과
   */
  validateFileType(expectedType: 'image' | 'file'): boolean {
    if (this._fileType !== expectedType) {
      throw new BlockManagementError(
        'MEDIA_FILE_TYPE_MISMATCH',
        `Expected ${expectedType} but got ${this._fileType}`
      );
    }
    return true;
  }

  /**
   * 파일 크기 검증
   *
   * @param sizeInBytes - 파일 크기 (바이트)
   * @returns 검증 결과
   */
  validateFileSize(sizeInBytes: number): boolean {
    if (sizeInBytes > this._maxSize) {
      throw new BlockManagementError(
        'MEDIA_FILE_SIZE_EXCEEDED',
        `File size ${sizeInBytes} bytes exceeds maximum allowed size ${this._maxSize} bytes`
      );
    }
    return true;
  }

  /**
   * MIME 타입 검증
   *
   * @param mimeType - MIME 타입
   * @returns 검증 결과
   */
  validateMimeType(mimeType: string): boolean {
    const allowedMimeTypes =
      this._fileType === 'image'
        ? [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
          ]
        : [
            'application/pdf',
            'text/plain',
            'application/json',
            'application/zip',
          ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BlockManagementError(
        'MEDIA_FILE_TYPE_NOT_SUPPORTED',
        `MIME type ${mimeType} is not supported for ${this._fileType} files`
      );
    }
    return true;
  }

  /**
   * 파일 확장자 추출
   *
   * @returns 파일 확장자
   */
  getFileExtension(): string {
    try {
      const url = new URL(this._value);
      const pathname = url.pathname;
      const lastDotIndex = pathname.lastIndexOf('.');
      return lastDotIndex !== -1
        ? pathname.substring(lastDotIndex + 1).toLowerCase()
        : '';
    } catch {
      return '';
    }
  }

  /**
   * 파일명 추출
   *
   * @returns 파일명
   */
  getFileName(): string {
    try {
      const url = new URL(this._value);
      const pathname = url.pathname;
      const lastSlashIndex = pathname.lastIndexOf('/');
      return lastSlashIndex !== -1
        ? pathname.substring(lastSlashIndex + 1)
        : '';
    } catch {
      return '';
    }
  }

  equals(other: MediaURL): boolean {
    if (!other) return false;
    return this._value === other._value && this._fileType === other._fileType;
  }

  toString(): string {
    return this._value;
  }
}
