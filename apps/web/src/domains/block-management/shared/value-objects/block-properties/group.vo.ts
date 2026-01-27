/**
 * Group Block Properties Value Object
 *
 * 그룹 블록의 속성을 관리하는 Value Object
 * Parent-Child 컨테이너용 (AI Visual Summary zones, 노드 그룹화)
 */

import { BlockPropertiesVO } from './base.vo';
import { ColorToken } from '../../types/style-tokens.types';

/**
 * Group Block Properties Interface (프론트엔드 공유용)
 */
export interface GroupBlockProperties {
  title: string;
  color: ColorToken;
}

/**
 * Group Block Properties Value Object
 */
export class GroupBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly title: string,
    private readonly color: ColorToken
  ) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): GroupBlockPropertiesVO {
    return new GroupBlockPropertiesVO('Group', ColorToken.BLUE);
  }

  /**
   * JSON에서 생성
   * 런타임 안전성을 위해 기본값 제공 (외부 데이터 대응)
   */
  static fromJSON(data: unknown): GroupBlockPropertiesVO {
    const safeData = (data as Partial<GroupBlockProperties>) ?? {};
    return new GroupBlockPropertiesVO(
      safeData.title ?? 'Group',
      safeData.color ?? ColorToken.BLUE
    );
  }

  /**
   * Properties 검증
   */
  protected validate(): boolean {
    return (
      typeof this.title === 'string' &&
      Object.values(ColorToken).includes(this.color)
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): GroupBlockProperties {
    return {
      title: this.title,
      color: this.color,
    };
  }

  /**
   * 값 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof GroupBlockPropertiesVO)) {
      return false;
    }

    return this.title === other.title && this.color === other.color;
  }

  getTitle(): string {
    return this.title;
  }

  getColor(): ColorToken {
    return this.color;
  }
}
