import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import type { MarkerType } from '../types/marker-type';
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
  /** 생성 시 지정할 수 있는 선택 필드 */
  label?: string;
  style?: { stroke?: string; strokeWidth?: number };
  shape?: string; // 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier'
  markerEnd?: MarkerType;
  markerStart?: MarkerType | null;
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

export interface UpdateEdgeMarkerCommand {
  edgeId: EdgeId;
  marker: 'start' | 'end';
  value: MarkerType;
  userId: UserId;
}

export interface DeleteEdgeCommand {
  edgeId: EdgeId;
  userId: UserId;
}

export interface UpdateEdgeConnectionCommand {
  edgeId: EdgeId;
  newSourceBlockMountId: BlockMountId;
  newTargetBlockMountId: BlockMountId;
  newSourceHandle: EdgeHandle;
  newTargetHandle: EdgeHandle;
  userId: UserId;
}
