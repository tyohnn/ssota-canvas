// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-edge.service.interface.ts

import type { Result } from '@/utils/result';
import type { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import type { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { EdgeShape } from '../../../shared/value-objects/edge-shape.vo';

/**
 * Canvas Edge Service Interface
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당하는 서비스 인터페이스
 * 구현체는 특정 ORM/DB에 의존하지 않도록 설계
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export interface ICanvasEdgeService {
  /**
   * 엣지 생성
   *
   * @param params - 엣지 생성 파라미터
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  createEdge(params: {
    pageId: PageId;
    sourceBlockMountId: BlockMountId;
    targetBlockMountId: BlockMountId;
    sourceHandle?: string;
    targetHandle?: string;
    edgeShape?: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 모양 업데이트
   *
   * @param params - 엣지 모양 업데이트 파라미터
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeShape(params: {
    edgeId: EdgeId;
    newShape: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 레이블 업데이트
   *
   * @param params - 엣지 레이블 업데이트 파라미터
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeLabel(params: {
    edgeId: EdgeId;
    newLabel: string;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 스타일 업데이트
   *
   * @param params - 엣지 스타일 업데이트 파라미터
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeStyle(params: {
    edgeId: EdgeId;
    style: {
      stroke?: string;
      strokeWidth?: number;
    };
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 삭제
   *
   * @param params - 엣지 삭제 파라미터
   * @returns void (성공) | Error (실패)
   */
  deleteEdge(params: {
    edgeId: EdgeId;
    userId: string;
  }): Promise<Result<void, Error>>;

  /**
   * 블럭 마운트 삭제 시 연결된 엣지 모두 삭제
   *
   * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
   *
   * @param blockMountId - 블럭 마운트 ID
   * @returns void (성공) | Error (실패)
   */
  deleteConnectedEdges(
    blockMountId: BlockMountId
  ): Promise<Result<void, Error>>;
}
