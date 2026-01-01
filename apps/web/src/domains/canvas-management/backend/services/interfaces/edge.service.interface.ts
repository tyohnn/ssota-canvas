// apps/web/src/domains/canvas-management/backend/services/interfaces/edge-management.service.interface.ts
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type {
  CreateEdgeRequest,
  DeleteEdgeRequest,
  UpdateEdgeLabelRequest,
  UpdateEdgeShapeRequest,
  UpdateEdgeStyleRequest,
} from '@/domains/canvas-management/shared/dtos/requests/edge.requests';
import type { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { Result } from '@/utils/result';

/**
 * Edge Management Service Interface
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음 (Trust Boundary 통과)
 * - SafeDTO → Command 변환은 Service에서 수행
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당하는 서비스 인터페이스
 * 구현체는 특정 ORM/DB에 의존하지 않도록 설계
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export interface IEdgeManagementService {
  /**
   * 엣지 생성
   *
   * @param safeDto - 검증된 엣지 생성 요청 (SafeDTO)
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  createEdge(safeDto: CreateEdgeRequest): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 모양 업데이트
   *
   * @param safeDto - 검증된 엣지 모양 업데이트 요청 (SafeDTO)
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeShape(
    safeDto: UpdateEdgeShapeRequest
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 레이블 업데이트
   *
   * @param safeDto - 검증된 엣지 레이블 업데이트 요청 (SafeDTO)
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeLabel(
    safeDto: UpdateEdgeLabelRequest
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 스타일 업데이트
   *
   * @param safeDto - 검증된 엣지 스타일 업데이트 요청 (SafeDTO)
   * @returns EdgeAggregate (성공) | Error (실패)
   */
  updateEdgeStyle(
    safeDto: UpdateEdgeStyleRequest
  ): Promise<Result<EdgeAggregate, Error>>;

  /**
   * 엣지 삭제
   *
   * @param safeDto - 검증된 엣지 삭제 요청 (SafeDTO)
   * @returns void (성공) | Error (실패)
   */
  deleteEdge(safeDto: DeleteEdgeRequest): Promise<Result<void, Error>>;

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
