// apps/web/src/domains/canvas-management/backend/services/canvas-edge.service.ts
import { Result } from '@/utils/result';

import { EdgeAggregate } from '../../shared/aggregates/edge.aggregate';
import type {
  CreateEdgeRequest,
  DeleteEdgeRequest,
  UpdateEdgeLabelRequest,
  UpdateEdgeShapeRequest,
  UpdateEdgeStyleRequest,
} from '../../shared/dtos/requests/edge.requests';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import { createEdge } from './edge/create-edge.service';
import { deleteConnectedEdges } from './edge/delete-connected-edges.service';
import { deleteEdge } from './edge/delete-edge.service';
import { updateEdgeLabel } from './edge/update-edge-label.service';
import { updateEdgeShape } from './edge/update-edge-shape.service';
import { updateEdgeStyle } from './edge/update-edge-style.service';
import type { ICanvasEdgeService } from './interfaces/canvas-edge.service.interface';

/**
 * Canvas Edge Service
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당하는 서비스 구현 (Drizzle ORM 사용)
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export class CanvasEdgeService implements ICanvasEdgeService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

  /**
   * 엣지 생성
   */
  async createEdge(
    safeDto: CreateEdgeRequest
  ): Promise<Result<EdgeAggregate, Error>> {
    return createEdge(safeDto, this.blockMountRepository, this.edgeRepository);
  }

  /**
   * 엣지 모양 업데이트
   */
  async updateEdgeShape(
    safeDto: UpdateEdgeShapeRequest
  ): Promise<Result<EdgeAggregate, Error>> {
    return updateEdgeShape(
      safeDto,
      this.blockMountRepository,
      this.edgeRepository
    );
  }

  /**
   * 엣지 레이블 업데이트
   */
  async updateEdgeLabel(
    safeDto: UpdateEdgeLabelRequest
  ): Promise<Result<EdgeAggregate, Error>> {
    return updateEdgeLabel(
      safeDto,
      this.blockMountRepository,
      this.edgeRepository
    );
  }

  /**
   * 엣지 스타일 업데이트
   */
  async updateEdgeStyle(
    safeDto: UpdateEdgeStyleRequest
  ): Promise<Result<EdgeAggregate, Error>> {
    return updateEdgeStyle(
      safeDto,
      this.blockMountRepository,
      this.edgeRepository
    );
  }

  /**
   * 엣지 삭제
   */
  async deleteEdge(safeDto: DeleteEdgeRequest): Promise<Result<void, Error>> {
    return deleteEdge(safeDto, this.blockMountRepository, this.edgeRepository);
  }

  /**
   * 블럭 마운트 삭제 시 연결된 엣지 모두 삭제
   */
  async deleteConnectedEdges(
    blockMountId: BlockMountId
  ): Promise<Result<void, Error>> {
    return deleteConnectedEdges(
      blockMountId,
      this.blockMountRepository,
      this.edgeRepository
    );
  }
}
