/**
 * Block 관련 Response 타입들 (Server Actions 출력)
 */

/**
 * 블록 속성 업데이트 후 반환되는 DTO
 */
export interface BlockPropertyUpdatedDTO {
  blockId: string;
  propertyPath: string;
  value: unknown;
  updatedAt: Date;
}

/**
 * 블록 속성 일괄 업데이트 후 반환되는 DTO
 */
export interface BlockPropertiesUpdatedDTO {
  blockId: string;
  properties: Record<string, unknown>;
  updatedAt: Date;
}

/**
 * 블록 제목 업데이트 후 반환되는 DTO
 */
export interface BlockTitleUpdatedDTO {
  blockId: string;
  title: string;
  updatedAt: Date;
}

/**
 * 블록 콘텐츠 업데이트 후 반환되는 DTO
 */
export interface BlockContentUpdatedDTO {
  blockId: string;
  content: unknown;
  updatedAt: Date;
}
