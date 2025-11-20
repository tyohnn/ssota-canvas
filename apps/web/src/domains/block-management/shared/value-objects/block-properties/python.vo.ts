import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * Python Block Properties Interface
 */
export interface PythonBlockProperties {
  code: string;
  language: string;
  output?: string;
}

/**
 * Python Block Properties Value Object
 *
 * Python 코드 블록의 속성을 관리하는 Value Object
 */
export class PythonBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly code: string,
    public readonly language: string,
    public readonly output?: string
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.code !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Code must be a string'
      );
    }

    if (
      typeof this.language !== 'string' ||
      this.language.trim().length === 0
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Language must be a non-empty string'
      );
    }

    if (this.output !== undefined && typeof this.output !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Output must be a string'
      );
    }

    // 지원되는 언어 검증
    if (!this.isSupportedLanguage(this.language)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        `Unsupported language: ${this.language}`
      );
    }
    return true;
  }

  /**
   * 지원되는 언어인지 확인
   */
  private isSupportedLanguage(language: string): boolean {
    const supportedLanguages = [
      'python',
      'javascript',
      'typescript',
      'java',
      'cpp',
      'c',
      'csharp',
      'go',
      'rust',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'scala',
      'r',
      'sql',
      'html',
      'css',
      'json',
      'yaml',
      'xml',
      'markdown',
    ];
    return supportedLanguages.includes(language.toLowerCase());
  }

  /**
   * 코드 업데이트
   */
  updateCode(code: string): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO(code, this.language, this.output);
  }

  /**
   * 언어 업데이트
   */
  updateLanguage(language: string): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO(this.code, language, this.output);
  }

  /**
   * 출력 업데이트
   */
  updateOutput(output: string): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO(this.code, this.language, output);
  }

  /**
   * 출력 제거
   */
  removeOutput(): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO(this.code, this.language);
  }

  /**
   * 출력이 있는지 확인
   */
  hasOutput(): boolean {
    return this.output !== undefined && this.output.trim().length > 0;
  }

  /**
   * 코드가 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.code.trim().length === 0;
  }

  /**
   * 코드 라인 수 계산
   */
  getLineCount(): number {
    return this.code.split('\n').length;
  }

  /**
   * 코드 문자 수 계산
   */
  getCharacterCount(): number {
    return this.code.length;
  }

  /**
   * 코드가 실행 가능한지 확인 (기본 검증)
   */
  isExecutable(): boolean {
    return !this.isEmpty() && this.language.toLowerCase() === 'python';
  }

  /**
   * 언어별 파일 확장자 반환
   */
  getFileExtension(): string {
    const languageMap: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      r: 'r',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yml',
      xml: 'xml',
      markdown: 'md',
    };

    return languageMap[this.language.toLowerCase()] || 'txt';
  }

  equals(other: PythonBlockPropertiesVO): boolean {
    return (
      this.code === other.code &&
      this.language === other.language &&
      this.output === other.output
    );
  }

  toString(): string {
    return `${this.language} Code Block`;
  }

  toJSON(): PythonBlockProperties {
    return {
      code: this.code,
      language: this.language,
      output: this.output,
    };
  }

  /**
   * JSON 데이터로부터 PythonBlockPropertiesVO 생성
   */
  static fromJSON(data: PythonBlockProperties): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO(data.code, data.language, data.output);
  }

  /**
   * 기본 Python 속성 생성
   */
  static createDefault(): PythonBlockPropertiesVO {
    return new PythonBlockPropertiesVO('', 'python');
  }
}
