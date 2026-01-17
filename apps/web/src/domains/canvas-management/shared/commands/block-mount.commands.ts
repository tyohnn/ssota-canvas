import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { BlockMount } from '../entities/block-mount.entity';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../value-objects/block-view-mode.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ViewModeSizes } from '../value-objects/view-mode-sizes.vo';
import { ZOrder } from '../value-objects/z-order.vo';

export interface MountBlockCommand {
  blockMountId: BlockMountId;
  pageId: PageId;
  blockId: BlockId;
  position: Position;
  size: Size;
  viewMode?: BlockViewMode; // 초기 viewMode (선택적, 기본값: original)
  viewModeSizes?: ViewModeSizes; // 모든 viewMode의 크기 (선택적, 제공되지 않으면 현재 viewMode만 설정)
  userId: UserId;
}

// Block Mount Deletion Commands
export interface SoftDeleteBlockMountCommand {
  blockMountId: BlockMountId;
  userId: UserId;
}

// Block Duplication Commands
export interface DuplicateBlockMountCommand {
  newBlockId: BlockId;
  originalBlockMount: BlockMount;
  offsetX: number;
  offsetY: number;
  userId: UserId;
}

// Block Page Move Commands
export interface MoveBlockToPageCommand {
  blockMountId: BlockMountId;
  targetPageId: PageId;
  newPosition: Position;
  userId: UserId;
}

// View/Transform Commands
export interface TransformBlockCommand {
  blockMountId: BlockMountId;
  newPosition?: Position;
  newSize?: Size;
  newZOrder?: ZOrder;
  userId: string;
}

export interface UpdateBlockPositionCommand {
  blockPositions: Array<{
    blockMountId: BlockMountId;
    position: Position;
  }>;
  userId: string;
}

/**
 * 단일 BlockMount 위치 업데이트 Command
 * (Aggregate에서 사용)
 */
export interface UpdateSingleBlockPositionCommand {
  newPosition: Position;
}

export interface UpdateBlockSizeCommand {
  blockMountId: BlockMountId;
  newSize: Size;
  userId: string;
}

/**
 * 단일 BlockMount 크기 업데이트 Command
 * (Aggregate에서 사용)
 */
export interface UpdateSingleBlockSizeCommand {
  newSize: Size;
  viewMode: BlockViewMode;
  userId: UserId;
}

/**
 * BlockMount View Mode 업데이트 Command
 */
export interface UpdateBlockMountViewModeCommand {
  blockMountId: BlockMountId;
  viewMode: BlockViewMode;
  userId: UserId;
}
