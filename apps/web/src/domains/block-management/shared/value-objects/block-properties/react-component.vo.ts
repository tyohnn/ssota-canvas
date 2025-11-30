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
export class ReactComponentBlockPropertiesVO extends BlockPropertiesVO<ReactComponentBlockProperties> {
  protected validate(): void {
    // No validation needed for optional properties
  }

  /**
   * Create default properties
   */
  static createDefault(): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO({
      code: '',
      template: 'react-ts',
    });
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: ReactComponentBlockProperties): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO(data);
  }
}
