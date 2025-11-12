/**
 * Block Properties Value Object - Base Class
 *
 * 모든 블록 타입의 Properties를 위한 기본 Value Object
 * - 불변성 (immutable)
 * - 값으로 비교 (equals)
 * - 비즈니스 규칙 포함
 * - JSON 변환 지원
 */

import { BlockProperties } from '../../types/block-data.types';
import { BlockType } from '../../types/block-types';

export abstract class BlockPropertiesVO {
  /**
   * 추가 필드 (커스텀 속성 값 등 알 수 없는 필드 보존용)
   */
  protected _extraFields: Record<string, any> = {};

  /**
   * Properties 검증
   * 각 블록 타입별로 구체적인 검증 로직 구현
   */
  protected abstract validate(): boolean;

  /**
   * JSON으로 변환 (프론트엔드 전달용)
   * 추가 필드도 포함하여 반환
   */
  abstract toJSON(): BlockProperties<BlockType> & Record<string, any>;

  /**
   * JSON에서 생성 (프론트엔드에서 받은 데이터로 생성)
   */
  static fromJSON?(data: BlockProperties<BlockType>): BlockPropertiesVO;

  /**
   * 값 비교
   * 기본 구현: JSON 직렬화로 비교
   * 필요시 각 클래스에서 오버라이드
   */
  equals(other: BlockPropertiesVO): boolean {
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }

  /**
   * 기본 Properties 생성
   * 각 블록 타입별로 구현
   */
  static createDefault?(): BlockPropertiesVO;

  /**
   * 특정 속성 업데이트 (불변성 유지)
   * @param propertyId - 속성 ID
   * @param value - 새로운 값
   * @returns 새로운 Properties Value Object
   */
  updateProperty(propertyId: string, value: any): BlockPropertiesVO {
    const newData = { ...this.toJSON(), [propertyId]: value };
    return (this.constructor as any).fromJSON(newData);
  }

  /**
   * 특정 속성 제거 (불변성 유지)
   * @param propertyId - 제거할 속성 ID
   * @returns 새로운 Properties Value Object
   */
  removeProperty(propertyId: string): BlockPropertiesVO {
    const newData = { ...this.toJSON() };
    delete (newData as any)[propertyId];
    return (this.constructor as any).fromJSON(newData);
  }
}
