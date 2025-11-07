/**
 * Markdown Block Properties Value Object
 *
 * 마크다운 블록의 속성을 관리하는 Value Object
 *
 * 특징:
 * - content는 block.content JSONB에 저장 (properties가 아님)
 * - properties에는 스타일 관련 속성만 포함 (color)
 */

import { BlockPropertiesVO } from './base.vo';
import { ColorToken } from '../../types/style-tokens.types';

/**
 * Markdown Block Properties Interface (프론트엔드 공유용)
 */
export interface MarkdownBlockProperties {
  color: ColorToken;
}

/**
 * Markdown Block Properties Value Object
 */
export class MarkdownBlockPropertiesVO extends BlockPropertiesVO {
  constructor(private readonly color: ColorToken) {
    super();
  }

  /**
   * 기본 Properties 생성
   */
  static createDefault(): MarkdownBlockPropertiesVO {
    return new MarkdownBlockPropertiesVO(
      ColorToken.GRAY // color
    );
  }

  /**
   * JSON에서 생성
   * 런타임 안전성을 위해 기본값 제공 (외부 데이터 대응)
   */
  static fromJSON(data: unknown): MarkdownBlockPropertiesVO {
    const safeData = (data as Partial<MarkdownBlockProperties>) ?? {};
    return new MarkdownBlockPropertiesVO(safeData.color ?? ColorToken.GRAY);
  }

  /**
   * Properties 검증
   */
  protected validate(): boolean {
    return Object.values(ColorToken).includes(this.color);
  }

  /**
   * JSON으로 변환
   */
  toJSON(): MarkdownBlockProperties {
    return {
      color: this.color,
    };
  }

  /**
   * 값 비교 (성능 최적화)
   */
  equals(other: BlockPropertiesVO): boolean {
    if (!(other instanceof MarkdownBlockPropertiesVO)) {
      return false;
    }

    return this.color === other.color;
  }

  // Getters for accessing properties
  getColor(): ColorToken {
    return this.color;
  }
}
