import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeType } from '../value-objects/edge-type.vo';
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
  pageId: PageId;
  blockId: BlockId;
  position: Position;
  size: Size;
  userId: string;
}

export interface CreateAndMountBlockCommand {
  pageId: PageId;
  blockType: string;
  workspaceId: string;
  position: Position;
  size: Size;
  userId: string;
  metadata?: Record<string, any>;
}

export interface TransformBlockCommand {
  blockMountId: BlockMountId;
  newPosition?: Position;
  newSize?: Size;
  newZOrder?: ZOrder;
  userId: string;
}

export interface UpdateBlockPositionCommand {
  blockMountId: BlockMountId;
  newPosition: Position;
  userId: string;
}

export interface UpdateBlockSizeCommand {
  blockMountId: BlockMountId;
  newSize: Size;
  userId: string;
}

export interface UpdateMultipleBlockPositionsCommand {
  blockPositions: Array<{
    blockMountId: BlockMountId;
    position: Position;
  }>;
  userId: string;
}

// Edge Commands
export interface CreateEdgeCommand {
  pageId: PageId;
  sourceBlockId: BlockId;
  targetBlockId: BlockId;
  edgeType?: EdgeType;
  userId: string;
}

export interface UpdateEdgeTypeCommand {
  edgeId: EdgeId;
  newType: EdgeType;
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
