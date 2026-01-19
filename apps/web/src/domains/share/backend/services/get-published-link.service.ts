/**
 * 게시 링크 조회 서비스
 *
 * 조회 전용 서비스이므로 Aggregate 패턴 불필요
 * 단순 조회 및 DTO 변환
 */

import { Result } from '@/utils/result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import type { GetPublishedLinkRequest } from '../../shared/dtos/request';
import type { PublishedLinkViewDTO } from '../../shared/dtos/response';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import type { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';

/**
 * 게시 링크 조회
 *
 * @param safeDto - 검증된 게시 링크 조회 요청 (SafeDTO)
 * @param publishedPageRepository - PublishedPage Repository
 * @returns 게시 링크 DTO 또는 null
 */
export async function getPublishedLink(
  safeDto: GetPublishedLinkRequest,
  publishedPageRepository: PublishedPageRepository
): Promise<Result<PublishedLinkViewDTO | null, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const pageId = new PageId(safeDto.pageId);

    // 2. PublishedPage 조회
    const publishedPage = await publishedPageRepository.findByPageId(
      pageId.value
    );

    if (!publishedPage || publishedPage.status !== 'published') {
      return Result.success(null);
    }

    // 3. 권한은 액션 레이어에서 이미 확인됨 (withSharePageSecureAction)
    // workspace/org 멤버라면 모두 게시 링크를 조회할 수 있음

    // 4. Response DTO 생성
    const publishToken = publishedPage.publishToken.toString();
    const result: PublishedLinkViewDTO = {
      publishToken,
      publishedAt: publishedPage.publishedAt.toISOString(),
    };

    return Result.success(result);
  } catch (error) {
    if (error instanceof ShareManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new ShareManagementError(
        'GET_PUBLISHED_LINK_FAILED',
        `Failed to get published link: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
