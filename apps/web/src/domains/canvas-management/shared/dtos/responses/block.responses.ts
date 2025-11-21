/**
 * Block 관련 Response 타입들 (Server Actions 출력)
 */

import type { BlockView } from '../views';
import type { Position, Size } from '../../types';

/**
 * 블럭 생성 및 마운트 완료 DTO (BlockView와 동일 - SSOT)
 */
export type BlockCreatedAndMountedDTO = BlockView;

/**
 * 블럭 변형 후 반환되는 DTO
 */
export interface TransformBlockDTO {
  blockMountId: string;
  position: Position;
  size: Size;
  zOrder: number;
  transformedAt: string;
}

/**
 * 블럭 위치 업데이트 후 반환되는 DTO
 */
export interface BlockPositionUpdatedDTO {
  blockMountId: string;
  newPosition: Position;
  updatedAt: string;
}

/**
 * 블럭 크기 업데이트 후 반환되는 DTO
 */
export interface BlockSizeUpdatedDTO {
  blockMountId: string;
  newSize: Size;
  updatedAt: string;
}

/**
 * 블럭 마운트 삭제 후 반환되는 DTO (단일 또는 다중)
 */
export interface BlockMountSoftDeletedDTO {
  deletedCount: number;
  deletedEdgesCount: number;
  deletedAt: string;
  deletedBlockMountIds: string[]; // 성공적으로 삭제된 블록 마운트 ID들
}

/**
 * 블럭 복제 및 마운트 완료 DTO
 */
export interface BlockDuplicatedAndMountedDTO {
  duplicatedBlockMountId: string;
  duplicatedBlockId: string;
  position: Position;
  size: Size;
  zOrder: number;
}
