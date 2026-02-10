/**
 * 블럭 마운트 복구 서비스 로직
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import type { RestoreBlockMountRequest } from '../../../shared/dtos/requests';
import { CanvasManagementError } from '../../../shared/errors/canvas-management.error';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import type { BlockMountRepository } from '../../repositories/interfaces/block-mount.repository.interface';

/**
 * 블럭 마운트 복구 (소프트 삭제 해제)
 *
 * @param safeDto - 검증된 블럭 마운트 복구 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param blockMountRepository - BlockMount Repository
 * @returns 복구 결과
 */
export async function restoreBlockMount(
  safeDto: RestoreBlockMountRequest,
  _safeUserId: UserId,
  blockMountRepository: BlockMountRepository
): Promise<
  Result<
    {
      restoredCount: number;
      restoredBlockMountIds: string[];
    },
    Error
  >
> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const blockMountIds = safeDto.blockMountIds.map(id => new BlockMountId(id));

    // 2. DB 복구 수행
    await blockMountRepository.restoreMany(blockMountIds);

    return Result.success({
      restoredCount: blockMountIds.length,
      restoredBlockMountIds: safeDto.blockMountIds,
    });
  } catch (error) {
    console.error(
      '❌ [restoreBlockMount] Block mount restoration failed:',
      error
    );
    return Result.error(
      new CanvasManagementError(
        'BLOCK_MOUNT_RESTORATION_FAILED',
        `Failed to restore block mount: ${error}`
      )
    );
  }
}
