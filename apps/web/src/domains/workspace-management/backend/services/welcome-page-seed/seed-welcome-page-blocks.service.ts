/**
 * Welcome 페이지 초기 블록 시딩 서비스
 *
 * 새 가입 사용자의 Welcome 페이지에 가이드용 블록들을 배치합니다.
 * - Idempotent: 이미 블록이 있으면 시딩 스킵
 * - 시딩 실패 시 조직/워크스페이스 생성에는 영향 없음 (graceful degradation)
 */

import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { createBlocksAndMounts } from '@/domains/canvas-management/backend/services/block-mount';
import type { CreateAndMountBlocksRequest } from '@/domains/canvas-management/shared/dtos/requests';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';

import { buildWelcomeBlocksConfig } from './welcome-blocks.template';

/**
 * Welcome 페이지에 초기 가이드 블록 배치
 *
 * @param pageId - Welcome 페이지 ID
 * @param workspaceId - 워크스페이스 ID
 * @param userId - 사용자 ID (생성자)
 * @returns 성공 여부 (실패 시 로그만 남기고 false 반환)
 */
export async function seedWelcomePageBlocks(
  pageId: string,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const pageIdVO = new PageId(pageId);
  const workspaceIdVO = new WorkspaceId(workspaceId);
  const userIdVO = new UserId(userId);

  const blockMountRepository = new DrizzleBlockMountRepository();
  const blockRepository = new DrizzleBlockRepository();

  try {
    // 1. Idempotency: 이미 블록이 있으면 시딩 스킵
    const existingMounts = await blockMountRepository.findByPageId(pageIdVO);
    if (existingMounts.length > 0) {
      return true; // 이미 시딩됨
    }

    // 2. 템플릿 기반 블록 배열 생성
    const blocks = buildWelcomeBlocksConfig();

    const safeDto: CreateAndMountBlocksRequest = {
      pageId,
      blocks,
    };

    // 3. createBlocksAndMounts 호출
    const result = await createBlocksAndMounts({
      safeDto,
      safeUserId: userIdVO,
      safeWorkspaceId: workspaceIdVO,
      blockRepository,
      blockMountRepository,
    });

    if (result.isError()) {
      console.error(
        '[seedWelcomePageBlocks] Failed to seed blocks:',
        result.error
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[seedWelcomePageBlocks] Unexpected error:', error);
    return false;
  }
}
