/**
 * Router Block Properties Value Object
 *
 * Link/File router 블록의 속성 (minimal)
 * - routerType: 'link' | 'file' - URL 입력 또는 파일 드롭 대기 구분
 */

import { BlockPropertiesVO } from './base.vo';

export type RouterType = 'link' | 'file';

export interface RouterBlockProperties {
  routerType: RouterType;
}

/**
 * Router Block Properties Value Object
 */
export class RouterBlockPropertiesVO extends BlockPropertiesVO {
  constructor(public readonly routerType: RouterType) {
    super();
    this.validate();
  }

  static createDefault(routerType?: RouterType): RouterBlockPropertiesVO {
    return new RouterBlockPropertiesVO(routerType ?? 'link');
  }

  static fromJSON(data: RouterBlockProperties): RouterBlockPropertiesVO {
    return new RouterBlockPropertiesVO(
      data.routerType === 'file' ? 'file' : 'link'
    );
  }

  protected validate(): boolean {
    if (this.routerType !== 'link' && this.routerType !== 'file') {
      throw new Error(
        `Invalid routerType: ${this.routerType}. Must be 'link' or 'file'.`
      );
    }
    return true;
  }

  toJSON(): RouterBlockProperties {
    return { routerType: this.routerType };
  }
}
