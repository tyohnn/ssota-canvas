/**
 * Block 관련 View 타입들 (조회용)
 */

import { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { Position, Size } from '../../types';
import type { UserProfile } from '@/domains/user-management/shared/types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BlockProperties } from '@/domains/block-management/shared/types/block-data.types';

/**
 * BlockView - SSOT (Single Source of Truth) for Block Data
 *
 * 캔버스에서 렌더링되는 블록의 완전한 데이터 구조
 * - Canvas Management: blockMountId, position, size, zOrder
 * - Block Management: blockId, blockType, properties, customProperties, createdBy, createdAt, updatedAt
 */
export interface BlockView {
  // Mount 정보 (Canvas Management Domain)
  blockMountId: string;
  position: Position;
  size: Size;
  zOrder: number;

  // Block 정보 (Block Management Domain)
  blockId: string;
  blockType: BlockType;
  properties: BlockProperties<BlockType>;
  customProperties: CustomPropertyDefinition[];

  // 메타데이터 (Block Management Domain)
  createdAt: string;
  updatedAt: string;
  createdByProfile?: UserProfile;
}

/**
 * BlockMountView - 블럭 마운트 정보만 (위치, 크기)
 */
export interface BlockMountView {
  blockMountId: string;
  pageId: string;
  blockId: string;
  position: Position;
  size: Size;
  zOrder: number;
  createdAt: string;
  updatedAt: string;
}
