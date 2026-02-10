/**
 * 엣지 복구 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import type { RestoreEdgeRequest } from '../../../shared/dtos/requests/edge.requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import type { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';

/**
 * 엣지 복구 (소프트 삭제 해제)
 *
 * @param safeDto - 검증된 엣지 복구 요청 (SafeDTO)
 * @param _safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param edgeRepository - Edge Repository
 * @returns 복구 결과
 */
export async function restoreEdge(
  safeDto: RestoreEdgeRequest,
  _safeUserId: UserId,
  edgeRepository: EdgeRepository
): Promise<
  Result<
    {
      restoredCount: number;
      restoredEdgeIds: string[];
    },
    Error
  >
> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const edgeIds = safeDto.edgeIds.map(id => new EdgeId(id));

    // 2. DB 복구 수행
    await edgeRepository.restoreMany(edgeIds);

    return Result.success({
      restoredCount: edgeIds.length,
      restoredEdgeIds: safeDto.edgeIds,
    });
  } catch (error) {
    console.error(
      '❌ [restoreEdge] Edge restoration failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'EDGE_RESTORATION_FAILED',
        `Failed to restore edge: ${error}`
      )
    );
  }
}
