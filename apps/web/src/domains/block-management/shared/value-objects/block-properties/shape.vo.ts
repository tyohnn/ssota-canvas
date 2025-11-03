/**
 * Shape Block Properties Value Object
 *
 * 도형 블록의 속성을 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';
import { ShapeType, BorderStyle } from './common-types';
import { ColorToken } from '../../types/style-tokens.types';

/**
 * Shape Block Properties Interface (프론트엔드 공유용)
 */
export interface ShapeBlockProperties {
  shapeType: ShapeType;
  content?: string;
  color: ColorToken;
  borderStyle: BorderStyle;
}

/**
 * Shape Block Properties Value Object
 */
export class ShapeBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly shapeType: ShapeType,
    private readonly content: string,
    private readonly color: ColorToken,
    private readonly borderStyle: BorderStyle
  ) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): ShapeBlockPropertiesVO {
    return new ShapeBlockPropertiesVO(
      ShapeType.RECTANGLE,
      '',
      ColorToken.BLUE,
      'solid'
    );
  }

  /**
   * JSON에서 생성
   * 런타임 안전성을 위해 기본값 제공 (외부 데이터 대응)
   */
  static fromJSON(data: unknown): ShapeBlockPropertiesVO {
    const safeData = (data as Partial<ShapeBlockProperties>) ?? {};
    return new ShapeBlockPropertiesVO(
      safeData.shapeType ?? ShapeType.RECTANGLE,
      safeData.content ?? '',
      safeData.color ?? ColorToken.BLUE,
      safeData.borderStyle ?? 'solid'
    );
  }

  /**
   * Properties 검증
   */
  protected validate(): boolean {
    const validBorderStyles = ['solid', 'dashed', 'dotted'];
    return (
      Object.values(ShapeType).includes(this.shapeType) &&
      Object.values(ColorToken).includes(this.color) &&
      validBorderStyles.includes(this.borderStyle)
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): ShapeBlockProperties {
    return {
      shapeType: this.shapeType,
      content: this.content,
      color: this.color,
      borderStyle: this.borderStyle,
    };
  }

  /**
   * 값 비교
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof ShapeBlockPropertiesVO)) {
      return false;
    }

    return (
      this.shapeType === other.shapeType &&
      this.content === other.content &&
      this.color === other.color &&
      this.borderStyle === other.borderStyle
    );
  }

  // Getters
  getShapeType(): ShapeType {
    return this.shapeType;
  }

  getContent(): string {
    return this.content;
  }

  getColor(): ColorToken {
    return this.color;
  }

  getBorderStyle(): BorderStyle {
    return this.borderStyle;
  }
}
