import { SourceManagementError } from '../errors/source-management.error';

export const SUPPORTED_LANGUAGES = [
  'en',
  'ko',
  'ja',
  'zh',
  'es',
  'fr',
  'de',
  'pt',
  'ru',
  'ar',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class LanguageCode {
  private readonly _code: string;

  constructor(code: string) {
    if (!this.isValid(code)) {
      throw new SourceManagementError(
        'INVALID_LANGUAGE_CODE',
        `Unsupported language code: ${code}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }
    this._code = code.toLowerCase();
  }

  get value(): string {
    return this._code;
  }

  private isValid(code: string): code is SupportedLanguage {
    if (!code || typeof code !== 'string') return false;
    const normalized = code.toLowerCase().trim();
    if (normalized.length !== 2) return false;
    return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage);
  }

  equals(other: LanguageCode): boolean {
    if (!other) return false;
    return this._code === other._code;
  }

  static isSupported(code: string): boolean {
    try {
      new LanguageCode(code);
      return true;
    } catch {
      return false;
    }
  }

  /** Returns LanguageCode when valid, null for null/empty or unsupported code (e.g. when reconstituting from DB). */
  static optional(code: string | null | undefined): LanguageCode | null {
    if (code == null || typeof code !== 'string' || !code.trim()) return null;
    try {
      return new LanguageCode(code);
    } catch {
      return null;
    }
  }
}
