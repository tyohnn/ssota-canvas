export interface CanvasInitializedDTO {
  canvasId: string;
  pageId: string;
  reactFlowInstanceId: string;
  initializedAt: string;
}

export interface CanvasDataLoadedDTO {
  canvasId: string;
  pageId: string;
  blockCount: number;
  edgeCount: number;
  loadedAt: string;
}

// Canvas Management Frontend DTOs (from Frontend Specification)
export interface CanvasView {
  canvasId: string;
  pageId: string;
  reactFlowInstanceId: string | null;
  isInitialized: boolean;
  blockCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

// GetCanvasViewQuery Result DTO (from Technical Specification)
export interface CreatedByProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface CanvasViewData {
  pageId: string;
  blocks: Array<{
    blockMountId: string;
    blockId: string;
    blockType: string;
    properties: Record<string, any>;
    customProperties: Array<{
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; label: string; color?: string }>;
      order: number;
      visible: boolean;
    }>;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zOrder: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string | CreatedByProfile;
  }>;
  edges: Array<{
    edgeId: string;
    pageId: string;
    sourceBlockId: string;
    targetBlockId: string;
    edgeShape: string;
    label?: string;
    style?: {
      stroke: string;
      strokeWidth: number;
    };
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  } | null;
}

export interface BlockMountView {
  blockMountId: string;
  pageId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EdgeView {
  edgeId: string;
  pageId: string;
  sourceBlockId: string;
  targetBlockId: string;
  edgeShape: string; // 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier'
  label?: string;
  style?: {
    stroke: string;
    strokeWidth: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ViewportView {
  viewportId: string;
  pageId: string;
  userId: string;
  zoomLevel: number;
  center: { x: number; y: number };
  minZoom: number;
  maxZoom: number;
  lastSavedAt: string;
}

// Request DTOs for Server Actions
export interface InitializeCanvasRequest {
  pageId: string;
}

export interface CreateBlockRequest {
  pageId: string;
  blockType: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  workspaceId: string;
  orgId?: string;
}

export interface MountBlockRequest {
  pageId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface TransformBlockRequest {
  blockMountId: string;
  newPosition?: { x: number; y: number };
  newSize?: { width: number; height: number };
  newZOrder?: number;
}

export interface UpdateBlockPositionRequest {
  blockMountId: string;
  newPosition: { x: number; y: number };
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface UpdateBlockSizeRequest {
  blockMountId: string;
  newSize: { width: number; height: number };
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface UpdateMultipleBlockPositionsRequest {
  blockPositions: Array<{
    blockMountId: string;
    position: { x: number; y: number };
  }>;
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface CreateEdgeRequest {
  pageId: string;
  sourceBlockId: string;
  targetBlockId: string;
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier';
}

export interface UpdateViewportRequest {
  pageId: string;
  zoomLevel?: number;
  center?: { x: number; y: number };
}

export interface MountBlockRequest {
  pageId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface MountBlockDTO {
  blockMountId: string;
  pageId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
  mountedAt: string;
}

export interface BlockMountedDTO {
  blockMountId: string;
  blockId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
}

export interface TransformBlockDTO {
  blockMountId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zOrder: number;
  transformedAt: string;
}

export interface BlockPositionUpdatedDTO {
  blockMountId: string;
  newPosition: { x: number; y: number };
  updatedAt: string;
}

export interface BlockSizeUpdatedDTO {
  blockMountId: string;
  newSize: { width: number; height: number };
  updatedAt: string;
}

export interface MultipleBlockPositionsUpdatedDTO {
  updatedCount: number;
  updatedAt: string;
}

// Block Mount Deletion DTOs
export interface DeleteBlockMountRequest {
  blockMountId: string;
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface DeleteMultipleBlockMountsRequest {
  blockMountIds: string[];
  orgId?: string;
  workspaceId?: string;
  pageId?: string;
}

export interface BlockMountDeletedDTO {
  blockMountId: string;
  deletedEdgesCount: number;
  deletedAt: string;
}

export interface MultipleBlockMountsDeletedDTO {
  deletedCount: number;
  deletedEdgesCount: number;
  deletedAt: string;
}

// CanvasPageData 타입 - 서버에서 초기 데이터 로드 시 사용
export interface CanvasPageData {
  canvas: CanvasView | null;
  blocks: BlockDTO[]; // Block 정보 (타입, 메타데이터)
  blockMounts: BlockMountView[]; // BlockMount 정보 (위치, 크기)
  edges: EdgeView[]; // 엣지 정보
  viewport: ViewportView | null;
}

// BlockDTO 임포트 (Block Management Domain에서)
export interface BlockDTO {
  id: string;
  blockType: string;
  workspaceId: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
