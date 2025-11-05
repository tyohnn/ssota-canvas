/**
 * Common Property Types
 *
 * 블록 Properties에서 공통으로 사용되는 타입들
 */

/**
 * Text Align Enum
 */
export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

/**
 * Font Size Enum
 */
export enum FontSize {
  SMALL = '14px',
  MEDIUM = '16px',
  LARGE = '20px',
  XLARGE = '24px',
}

/**
 * Shape Type Enum
 */
export enum ShapeType {
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  TRIANGLE = 'triangle',
  DIAMOND = 'diamond',
  HEXAGON = 'hexagon',
  PARALLELOGRAM = 'parallelogram',
  CYLINDER = 'cylinder',
}

/**
 * Border Style Type
 */
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Aspect Ratio Type (Image/Video blocks)
 */
export type AspectRatio = 'original' | '16:9' | '4:3' | '1:1' | 'custom';

/**
 * Object Fit Type (Image/Video blocks)
 */
export type ObjectFit = 'contain' | 'cover' | 'fill';

/**
 * Property Type Enum - 지원하는 속성 타입들
 */
export enum PropertyType {
  TEXT = 'text',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  PROFILE = 'profile',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  COLOR = 'color',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * Property Option Interface - 선택 옵션 정의
 */
export interface PropertyOption {
  id: string;
  label: string;
  value: string;
  color?: string;
  order: number;
  disabled?: boolean;
  description?: string;
}

/**
 * 커스텀 속성 정의 (DB 구조와 일치)
 */
export interface CustomPropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
  order: number;
  visible: boolean;
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}
