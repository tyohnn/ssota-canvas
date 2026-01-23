/**
 * LanguageCode Value Object
 *
 * ISO 639-1 언어 코드를 나타내는 Value Object
 * - 2자리 언어 코드 검증
 * - 지원되는 언어 목록 관리
 * - video-id.vo 패턴 준수
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

/**
 * 지원되는 언어 코드 목록 (ISO 639-1)
 * 최소 10개 언어 지원
 */
export const SUPPORTED_LANGUAGES = [
  'en', // English
  'ko', // Korean
  'ja', // Japanese
  'zh', // Chinese
  'es', // Spanish
  'fr', // French
  'de', // German
  'pt', // Portuguese
  'ru', // Russian
  'ar', // Arabic
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class LanguageCode {
  private readonly _code: string;

  constructor(code: string) {
    if (!this.isValid(code)) {
      throw new YoutubeError(
        'UNSUPPORTED_LANGUAGE',
        `Unsupported language code: ${code}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
        {
          languageCode: code,
          supportedLanguages: SUPPORTED_LANGUAGES,
        }
      );
    }
    this._code = code.toLowerCase();
  }

  get value(): string {
    return this._code;
  }

  private isValid(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // 2자리 언어 코드 검증
    const normalizedCode = code.toLowerCase().trim();
    if (normalizedCode.length !== 2) {
      return false;
    }

    // 지원되는 언어 목록에 포함되는지 확인
    return SUPPORTED_LANGUAGES.includes(normalizedCode as SupportedLanguage);
  }

  equals(other: LanguageCode): boolean {
    if (!other) return false;
    return this._code === other._code;
  }

  /**
   * 지원되는 언어인지 확인
   */
  static isSupported(code: string): boolean {
    try {
      new LanguageCode(code);
      return true;
    } catch {
      return false;
    }
  }
}
