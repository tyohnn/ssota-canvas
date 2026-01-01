// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-block-mount.service.interface.ts
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import type { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type {
  CreateAndMountBlockRequest,
  DuplicateBlockAndMountRequest,
  MoveBlockToPageRequest,
  SoftDeleteBlockMountRequest,
  UpdateBlockPositionRequest,
  UpdateBlockSizeRequest,
} from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { Result } from '@/utils/result';

/**
 * Canvas Block Mount Service Interface
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스 인터페이스
 * 구현체는 특정 ORM/DB에 의존하지 않도록 설계
 */
export interface ICanvasBlockMountService {
  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns blockMountAggregate (마운트 정보) + blockAggregate (블럭 엔티티) | Error (실패)
   */
  createAndMountBlock(
    safeDto: CreateAndMountBlockRequest & {
      userId: string;
      workspaceId: string;
    }
  ): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  >;

  /**
   * 블럭 위치 업데이트 (단일 또는 다중)
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns BlockMountAggregate[] (성공) | Error (실패)
   */
  updateBlockPosition(
    safeDto: UpdateBlockPositionRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate[], Error>>;

  /**
   * 블럭 크기 업데이트
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  updateBlockSize(
    safeDto: UpdateBlockSizeRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate, Error>>;

  /**
   * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns 삭제된 블럭과 엣지 개수 (성공) | Error (실패)
   */
  softDeleteBlockMount(
    safeDto: SoftDeleteBlockMountRequest & {
      userId: string;
    }
  ): Promise<
    Result<
      {
        deletedCount: number;
        deletedEdgesCount: number;
        deletedBlockMountIds: BlockMountId[];
      },
      Error
    >
  >;

  /**
   * 블럭 페이지 이동
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  moveBlockToPage(
    safeDto: MoveBlockToPageRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate, Error>>;

  /**
   * 블럭 복제 (Block Management Service와 연동)
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   *
   * @param safeDto - 검증된 SafeDTO (Trust Boundary 통과)
   * @returns blockMountAggregate (마운트 정보) + blockAggregate (블럭 엔티티) | Error (실패)
   */
  duplicateBlockAndMount(
    safeDto: DuplicateBlockAndMountRequest & {
      userId: string;
      workspaceId: string;
    }
  ): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  >;
}
