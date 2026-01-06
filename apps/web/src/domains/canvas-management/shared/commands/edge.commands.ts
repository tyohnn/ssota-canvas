import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../value-objects/edge-handle.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';

// Edge Commands
// ⚠️ Schema Change: now uses BlockMountId instead of BlockId
export interface CreateEdgeCommand {
  pageId: PageId;
  sourceBlockMountId: BlockMountId;
  targetBlockMountId: BlockMountId;
  sourceHandle: EdgeHandle;
  targetHandle: EdgeHandle;
  userId: UserId;
}

export interface UpdateEdgeShapeCommand {
  edgeId: EdgeId;
  newShape: EdgeShape;
  userId: UserId;
}

export interface UpdateEdgeLabelCommand {
  edgeId: EdgeId;
  newLabel: string;
  userId: UserId;
}

export interface UpdateEdgeStyleCommand {
  edgeId: EdgeId;
  style: {
    stroke?: string;
    strokeWidth?: number;
  };
  userId: UserId;
}

export interface DeleteEdgeCommand {
  edgeId: EdgeId;
  userId: UserId;
}
