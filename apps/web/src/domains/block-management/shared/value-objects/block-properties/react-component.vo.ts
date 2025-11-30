/**
 * React Component Block Properties
 *
 * 사용자가 직접 설정/입력하는 속성만 포함
 */

import { BlockPropertiesVO } from './base.vo';

export interface ReactComponentBlockProperties {
  code?: string; // React 컴포넌트 코드 (사용자가 작성) - legacy single file approach
  template?: string; // Sandpack template (react-ts, vite, etc.)
  dependencies?: Record<string, string>; // NPM dependencies for Nodebox
  files?: Record<string, { code: string }>; // Multiple files for Sandpack
  // 렌더링 옵션은 컴포넌트 내부에서 관리:
  // - autorun, autoReload 등
}

/**
 * React Component Block Properties Value Object
 */
export class ReactComponentBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly code: string = '',
    private readonly template: string = 'react-ts',
    private readonly dependencies: Record<string, string> = {},
    private readonly files: Record<string, { code: string }> = {}
  ) {
    super();
  }

  protected validate(): boolean {
    // No validation needed for optional properties
    return true;
  }

  /**
   * Create default properties
   */
  static createDefault(): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO('', 'react-ts', {}, {});
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: unknown): ReactComponentBlockPropertiesVO {
    const safeData = (data as Partial<ReactComponentBlockProperties>) ?? {};
    return new ReactComponentBlockPropertiesVO(
      safeData.code ?? '',
      safeData.template ?? 'react-ts',
      safeData.dependencies ?? {},
      safeData.files ?? {}
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): ReactComponentBlockProperties {
    return {
      code: this.code,
      template: this.template,
      dependencies: this.dependencies,
      files: this.files,
    };
  }

  /**
   * 값 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof ReactComponentBlockPropertiesVO)) {
      return false;
    }

    return (
      this.code === other.code &&
      this.template === other.template &&
      JSON.stringify(this.dependencies) === JSON.stringify(other.dependencies) &&
      JSON.stringify(this.files) === JSON.stringify(other.files)
    );
  }

  // Getters for accessing properties
  getCode(): string {
    return this.code;
  }

  getTemplate(): string {
    return this.template;
  }

  getDependencies(): Record<string, string> {
    return this.dependencies;
  }

  getFiles(): Record<string, { code: string }> {
    return this.files;
  }
}
