import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { BlockMount } from '../entities/block-mount.entity';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../value-objects/edge-handle.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';

export interface InitializeCanvasCommand {
  pageId: PageId;
  userId: string;
}

export interface LoadCanvasDataCommand {
  pageId: PageId;
  userId: string;
}

export interface GetViewportCommand {
  pageId: PageId;
  userId: string;
}

export interface MountBlockCommand {
  blockMountId: BlockMountId;
  pageId: PageId;
  blockId: BlockId;
  position: Position;
  size: Size;
  userId?: UserId;
}

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
}

// Edge Commands
// ⚠️ Schema Change: now uses BlockMountId instead of BlockId
export interface CreateEdgeCommand {
  pageId: PageId;
  sourceBlockMountId: BlockMountId;
  targetBlockMountId: BlockMountId;
  sourceHandle: EdgeHandle;
  targetHandle: EdgeHandle;
}

export interface UpdateEdgeShapeCommand {
  edgeId: EdgeId;
  newShape: EdgeShape;
}

export interface UpdateEdgeLabelCommand {
  edgeId: EdgeId;
  newLabel: string;
}

export interface UpdateEdgeStyleCommand {
  edgeId: EdgeId;
  style: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface DeleteEdgeCommand {
  edgeId: EdgeId;
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
}

// Block Page Move Commands
export interface MoveBlockToPageCommand {
  blockMountId: BlockMountId;
  targetPageId: PageId;
  newPosition: Position;
  userId: UserId;
}
