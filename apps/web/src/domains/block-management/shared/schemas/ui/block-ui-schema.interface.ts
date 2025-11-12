import type { PropertyOption } from '../../value-objects/block-properties/common-types';
/**
 * Block UI Schema Interface
 *
 * 블록의 UI 렌더링을 위한 스키마 정의
 * 검증 스키마와 분리되어 순수하게 UI 표현에만 집중
 */

/**
 * 속성 입력 타입
 */
export type PropertyInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'phone'
  | 'select'
  | 'status'
  | 'multi-select'
  | 'datetime'
  | 'color'
  | 'checkbox'
  | 'profile'
  | 'media'
  | 'image-upload'
  | 'readonly-text'
  | 'readonly-datetime'
  | 'readonly-profile';

/**
 * 속성 UI 정의
 */
export interface PropertyUIDefinition {
  /** 표시 라벨 */
  label: string;
  /** 입력 타입 */
  inputType: PropertyInputType;
  /** 아이콘 (Lucide React 아이콘 이름 또는 React 컴포넌트) */
  icon?: string;
  /** 도움말/설명 */
  description?: string;
  /** placeholder */
  placeholder?: string;
  /** 렌더링 순서 */
  order: number;
  /** 읽기 전용 여부 */
  readonly?: boolean;
  /** 옵션 (select, multi-select용) */
  options?: Array<PropertyOption>;
  /** 조건부 렌더링 */
  showIf?: (properties: Record<string, any>) => boolean;
  /** 기본값 표시 함수 */
  defaultDisplay?: (value: any) => string;
}

/**
 * 속성 그룹 정의
 */
export interface PropertyGroupDefinition {
  /** 그룹 ID */
  id: string;
  /** 그룹 라벨 */
  label: string;
  /** 그룹 설명 */
  description?: string;
  /** 기본 펼침/접힘 상태 */
  defaultCollapsed?: boolean;
  /** 그룹 순서 */
  order: number;
  /** 이 그룹에 속한 속성 키 목록 */
  properties: string[];
}

/**
 * 블록 UI 스키마
 */
export interface BlockUISchema {
  /** 블록 타입 */
  blockType: string;
  /** 속성 그룹들 */
  groups: PropertyGroupDefinition[];
  /** 속성별 UI 정의 */
  properties: Record<string, PropertyUIDefinition>;
}

/**
 * UI 스키마 레지스트리 인터페이스
 */
export interface BlockUISchemaRegistry {
  register(blockType: string, schema: BlockUISchema): void;
  get(blockType: string): BlockUISchema | null;
  has(blockType: string): boolean;
  getAll(): Record<string, BlockUISchema>;
}
