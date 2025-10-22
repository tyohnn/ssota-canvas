// apps/web/src/domains/canvas-management/backend/services/index.ts

// Services
export { DefaultCanvasQueryService } from './canvas-query.service';
export { DefaultCanvasBlockMountService } from './canvas-block-mount.service';
export { DefaultCanvasEdgeService } from './canvas-edge.service';

// Interfaces
export type { CanvasQueryService } from './interfaces/canvas-query.service.interface';
export type { CanvasBlockMountService } from './interfaces/canvas-block-mount.service.interface';
export type { CanvasEdgeService } from './interfaces/canvas-edge.service.interface';

// Common Types
export type {
  ServiceResult,
  CanvasViewResult,
} from './interfaces/common.types';

// Legacy export (호환성 유지)
export { CanvasManagementService } from './canvas-management.service';
