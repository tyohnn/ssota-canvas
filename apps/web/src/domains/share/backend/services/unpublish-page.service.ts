/**
 * 페이지 게시 취소 서비스
 *
 * ✅ Event Storming + DDD 패턴:
 * - SafeDTO를 입력으로 받음
 * - SafeDTO → Command 변환
 * - Aggregate에 Command 전달
 * - Domain Event 처리
 */

import { Result } from '@/utils/result';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

import { PublishedPageAggregate } from '../../shared/aggregates/published-page.aggregate';
import { UnpublishPageCommand } from '../../shared/commands';
import type { UnpublishPageRequest } from '../../shared/dtos/request';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import type { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';

/**
 * 페이지 게시 취소
 *
 * @param safeDto - 검증된 페이지 게시 취소 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param publishedPageRepository - PublishedPage Repository
 * @returns void
 */
export async function unpublishPage(
  safeDto: UnpublishPageRequest,
  safeUserId: UserId,
  publishedPageRepository: PublishedPageRepository
): Promise<Result<void, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const pageId = new PageId(safeDto.pageId);

    // 2. PublishedPage 조회
    const publishedPage = await publishedPageRepository.findByPageId(
      pageId.value
    );

    if (!publishedPage) {
      return Result.error(
        new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found')
      );
    }

    // 3. 이미 unpublished 상태인지 확인 (Idempotent 처리)
    if (publishedPage.isUnpublished()) {
      // 이미 unpublished 상태라면 추가 작업 없이 성공 반환
      return Result.success(undefined);
    }

    // 4. Aggregate 재구성
    const aggregate = PublishedPageAggregate.reconstitute(publishedPage);

    // 5. SafeDTO → Command 변환
    const command: UnpublishPageCommand = {
      publisherId: safeUserId.value,
    };

    // 6. Aggregate에 Command 전달 (Command → Event)
    aggregate.unpublish(command);

    // 7. Entity 저장
    const updatedPage = aggregate.getPublishedPage();
    await publishedPageRepository.save(updatedPage);

    // 8. Domain Event 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 9. Event 커밋
    aggregate.markEventsAsCommitted();

    // 10. 결과 반환
    return Result.success(undefined);
  } catch (error) {
    if (error instanceof ShareManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new ShareManagementError(
        'UNPUBLISH_PAGE_FAILED',
        `Failed to unpublish page: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
