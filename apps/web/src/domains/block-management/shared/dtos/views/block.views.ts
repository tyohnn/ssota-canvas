/**
 * Block 관련 View 타입들 (조회용)
 */

import type { UserProfile } from '@/domains/user-management/shared/types';
import { BlockProperties } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

/**
 * BlockView - SSOT (Single Source of Truth) for Block Data
 *
 * 블록의 완전한 데이터 구조
 * - Block Management: blockId, blockType, properties, customProperties, createdBy, createdAt, updatedAt
 * - Canvas Management: position, size (필요시 추가)
 */
export interface BlockView {
  // Block 정보 (Block Management Domain)
  id: string;
  workspaceId: string;
  canvasId: string;
  type: string;
  position: { x: number; y: number };
  properties: BlockProperties<BlockType>;
  customProperties: CustomPropertyDefinition[];

  // 메타데이터 (Block Management Domain)
  createdAt: Date;
  updatedAt: Date;
  createdByProfile: UserProfile;
}
