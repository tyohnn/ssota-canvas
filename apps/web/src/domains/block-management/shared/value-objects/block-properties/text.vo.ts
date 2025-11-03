/**
 * Text Block Properties Value Object
 *
 * 텍스트 블록의 속성을 관리하는 Value Object
 */

import { BlockPropertiesVO } from './base.vo';
import { ColorToken } from '../../types/style-tokens.types';
import { TextAlign, FontSize } from './common-types';

/**
 * Text Block Properties Interface (프론트엔드 공유용)
 */
export interface TextBlockProperties {
  content: string;
  color: ColorToken;
  richStyle: boolean;
  textAlign: TextAlign;
  fontSize: FontSize;
}

/**
 * Text Block Properties Value Object
 */
export class TextBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly content: string,
    private readonly color: ColorToken,
    private readonly richStyle: boolean,
    private readonly textAlign: TextAlign,
    private readonly fontSize: FontSize
  ) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): TextBlockPropertiesVO {
    return new TextBlockPropertiesVO(
      '', // content
      ColorToken.GRAY, // color
      false, // richStyle
      TextAlign.LEFT, // textAlign
      FontSize.MEDIUM // fontSize
    );
  }

  /**
   * JSON에서 생성
   * 런타임 안전성을 위해 기본값 제공 (외부 데이터 대응)
   */
  static fromJSON(data: unknown): TextBlockPropertiesVO {
    const safeData = (data as Partial<TextBlockProperties>) ?? {};
    return new TextBlockPropertiesVO(
      safeData.content ?? '',
      safeData.color ?? ColorToken.GRAY,
      safeData.richStyle ?? false,
      safeData.textAlign ?? TextAlign.LEFT,
      safeData.fontSize ?? FontSize.MEDIUM
    );
  }

  /**
   * Properties 검증
   */
  protected validate(): boolean {
    return (
      typeof this.content === 'string' &&
      typeof this.richStyle === 'boolean' &&
      Object.values(TextAlign).includes(this.textAlign) &&
      Object.values(FontSize).includes(this.fontSize)
    );
  }

  /**
   * JSON으로 변환
   */
  toJSON(): TextBlockProperties {
    return {
      content: this.content,
      color: this.color,
      richStyle: this.richStyle,
      textAlign: this.textAlign,
      fontSize: this.fontSize,
    };
  }

  /**
   * 값 비교 (성능 최적화)
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof TextBlockPropertiesVO)) {
      return false;
    }

    return (
      this.content === other.content &&
      this.color === other.color &&
      this.richStyle === other.richStyle &&
      this.textAlign === other.textAlign &&
      this.fontSize === other.fontSize
    );
  }

  // Getters for accessing properties
  getContent(): string {
    return this.content;
  }

  getColor(): ColorToken {
    return this.color;
  }

  getRichStyle(): boolean {
    return this.richStyle;
  }

  getTextAlign(): TextAlign {
    return this.textAlign;
  }

  getFontSize(): FontSize {
    return this.fontSize;
  }
}
