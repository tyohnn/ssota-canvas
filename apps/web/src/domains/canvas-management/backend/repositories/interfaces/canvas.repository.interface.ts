import { CanvasAggregate } from '../../../shared/aggregates/canvas.aggregate';
import { CanvasId } from '../../../shared/value-objects/canvas-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

export interface CanvasRepository {
  save(canvas: CanvasAggregate): Promise<void>;
  findById(canvasId: CanvasId): Promise<CanvasAggregate | null>;
  findByPageId(pageId: PageId): Promise<CanvasAggregate | null>;
  delete(canvasId: CanvasId): Promise<void>;
}
