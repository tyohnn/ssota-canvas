import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { BlockMount } from '../entities/block-mount.entity';

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

export interface UpdateBlockSizeCommand {
  blockMountId: BlockMountId;
  newSize: Size;
  userId: string;
}

// Edge Commands
// ⚠️ Schema Change: now uses BlockMountId instead of BlockId
export interface CreateEdgeCommand {
  pageId: PageId;
  sourceBlockMountId: BlockMountId;
  targetBlockMountId: BlockMountId;
  sourceHandle?: string; // React Flow handle ID ('left', 'right', 'top', 'bottom')
  targetHandle?: string; // React Flow handle ID ('left', 'right', 'top', 'bottom')
  edgeShape?: EdgeShape;
  userId: string;
}

export interface UpdateEdgeShapeCommand {
  edgeId: EdgeId;
  newShape: EdgeShape;
  userId: string;
}

export interface UpdateEdgeLabelCommand {
  edgeId: EdgeId;
  newLabel: string;
  userId: string;
}

export interface UpdateEdgeStyleCommand {
  edgeId: EdgeId;
  style: {
    stroke?: string;
    strokeWidth?: number;
  };
  userId: string;
}

export interface DeleteEdgeCommand {
  edgeId: EdgeId;
  userId: string;
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
