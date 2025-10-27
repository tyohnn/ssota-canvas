/**
 * Block Type Schemas (New Architecture)
 *
 * 분리된 스키마 시스템을 사용하는 새로운 구현
 */

import { loadBlockSchemas, getBlockSchema } from './block-schema-loader';

// 스키마 초기화
loadBlockSchemas();

/**
 * 블록 타입별 스키마 조회 (레거시 호환)
 */
export function getBlockTypeSchema(blockType: string) {
  return getBlockSchema(blockType);
}

/**
 * 블록이 스켈레톤 상태인지 확인
 */
export function isBlockSkeleton(
  blockType: string,
  properties: Record<string, any>
): boolean {
  const schema = getBlockSchema(blockType);

  // 필수 속성이 모두 채워져 있는지 확인
  return schema.required.some(prop => {
    const value = properties[prop];
    return value === undefined || value === null || value === '';
  });
}

/**
 * 블록이 완성된 상태인지 확인
 */
export function isBlockCompleted(
  blockType: string,
  properties: Record<string, any>
): boolean {
  return !isBlockSkeleton(blockType, properties);
}

/**
 * 블록의 완성도 퍼센트 계산
 */
export function getBlockCompletionPercentage(
  blockType: string,
  properties: Record<string, any>
): number {
  const schema = getBlockSchema(blockType);
  const totalRequired = schema.required.length;
  const completedRequired = schema.required.filter(prop => {
    const value = properties[prop];
    return value !== undefined && value !== null && value !== '';
  }).length;

  return Math.round((completedRequired / totalRequired) * 100);
}
