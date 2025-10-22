// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-edge.service.interface.ts

import type { Result } from '@/utils/result';
import type { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import type { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type {
  CreateEdgeCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeStyleCommand,
  DeleteEdgeCommand,
} from '../../../shared/commands';

/**
 * Canvas Edge Service Interface
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당하는 서비스
 */
export interface CanvasEdgeService {
  /**
   * 엣지 생성
   *
   * @param command - 엣지 생성 Command
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  createEdge(command: CreateEdgeCommand): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 모양 업데이트
   *
   * @param command - 엣지 모양 업데이트 Command
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeShape(
    command: UpdateEdgeShapeCommand
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 레이블 업데이트
   *
   * @param command - 엣지 레이블 업데이트 Command
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeLabel(
    command: UpdateEdgeLabelCommand
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 스타일 업데이트
   *
   * @param command - 엣지 스타일 업데이트 Command
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeStyle(
    command: UpdateEdgeStyleCommand
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 삭제
   *
   * @param command - 엣지 삭제 Command
   * @returns void (성공) | Error (실패)
   */
  deleteEdge(command: DeleteEdgeCommand): Promise<Result<void, Error>>;

  /**
   * 블럭 삭제 시 연결된 엣지 모두 삭제
   *
   * @param blockId - 블럭 ID
   * @returns void (성공) | Error (실패)
   */
  deleteConnectedEdges(blockId: BlockId): Promise<Result<void, Error>>;
}
