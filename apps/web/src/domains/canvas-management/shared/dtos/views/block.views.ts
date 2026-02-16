/**
 * Block 관련 View 타입들 (조회용)
 */
import { BlockProperties } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { UserProfile } from '@/domains/user-management/shared/types';

import type { Position, Size } from '../../types';
import type { BlockViewModeValue } from '../../value-objects/block-view-mode.vo';
import type { ViewModeSizeMap } from '../../value-objects/view-mode-sizes.vo';

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
  viewMode: BlockViewModeValue;
  viewModeSizes?: ViewModeSizeMap; // 뷰 모드별 크기 정보 (original, card, note)
  /** Parent-Child: 부모 그룹의 blockMountId (DB: block_mounts.parent_block_mount_id) */
  parentBlockMountId?: string;

  // Block 정보 (Block Management Domain)
  blockId: string;
  blockType: BlockType;
  title: string;
  properties: BlockProperties<BlockType>;
  customProperties: CustomPropertyDefinition[];
  content?: unknown; // JSONB content (TipTap JSON, 기타 구조화된 콘텐츠)
  /** ProseMirror step sync: server content_version for optimistic locking */
  contentVersion?: number;
  /** 링크된 소스 ID (source-management sources.id, optional) */
  sourceId?: string;

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
  viewMode: BlockViewModeValue;
  /** Parent-Child: 부모 그룹의 blockMountId (DB: block_mounts.parent_block_mount_id) */
  parentBlockMountId?: string;
  createdAt: string;
  updatedAt: string;
}
