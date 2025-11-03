/**
 * Shape Block Properties Value Object
 *
 * 도형 블록의 속성을 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';
import { ShapeType } from './common-types';
import { ColorToken } from '../../types/style-tokens.types';

/**
 * Shape Block Properties Interface (프론트엔드 공유용)
 */
export interface ShapeBlockProperties {
  shapeType: ShapeType;
  color: ColorToken;
}

/**
 * Shape Block Properties Value Object
 */
export class ShapeBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly shapeType: ShapeType,
    private readonly color: ColorToken
  ) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): ShapeBlockPropertiesVO {
    return new ShapeBlockPropertiesVO(ShapeType.RECTANGLE, ColorToken.GRAY);
  }

  /**
   * JSON에서 생성
   */
  static fromJSON(data: ShapeBlockProperties): ShapeBlockPropertiesVO {
    return new ShapeBlockPropertiesVO(
      data.shapeType || ShapeType.RECTANGLE,
      data.color || ColorToken.GRAY
    );
  }

  /**
   * Properties 검증
   */
  validate(): boolean {
    return (
      Object.values(ShapeType).includes(this.shapeType) &&
      Object.values(ColorToken).includes(this.color)
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): ShapeBlockProperties {
    return {
      shapeType: this.shapeType,
      color: this.color,
    };
  }

  /**
   * 값 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof ShapeBlockPropertiesVO)) {
      return false;
    }

    return this.shapeType === other.shapeType && this.color === other.color;
  }

  // Getters
  getShapeType(): ShapeType {
    return this.shapeType;
  }

  getColor(): ColorToken {
    return this.color;
  }
}
