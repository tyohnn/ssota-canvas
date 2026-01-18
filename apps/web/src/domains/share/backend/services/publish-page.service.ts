/**
 * 페이지 게시 서비스
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
import { PublishPageCommand } from '../../shared/commands';
import type { PublishPageRequest } from '../../shared/dtos/request';
import type { PublishResultDTO } from '../../shared/dtos/response';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import type { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';

/**
 * 페이지 게시
 *
 * @param safeDto - 검증된 페이지 게시 요청 (SafeDTO)
 * @param safeUserId - 검증된 사용자 ID (인증된 사용자)
 * @param publishedPageRepository - PublishedPage Repository
 * @returns 게시 결과 DTO
 */
export async function publishPage(
  safeDto: PublishPageRequest,
  safeUserId: UserId,
  publishedPageRepository: PublishedPageRepository
): Promise<Result<PublishResultDTO, Error>> {
  try {
    // 1. SafeDTO → Value Objects 생성
    const pageId = new PageId(safeDto.pageId);

    // 2. SafeDTO → Command 변환
    const command: PublishPageCommand = {
      pageId: pageId.value,
      publisherId: safeUserId.value,
    };

    // 3. Aggregate 생성 (Command → Event)
    const aggregate = PublishedPageAggregate.publish(command);

    // 4. Entity 저장
    const publishedPage = aggregate.getPublishedPage();
    await publishedPageRepository.save(publishedPage);

    // 5. Domain Event 처리
    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(event => event.handle()));

    // 6. Event 커밋
    aggregate.markEventsAsCommitted();

    // 7. Response DTO 생성
    const publishToken = publishedPage.publishToken.toString();
    const result: PublishResultDTO = {
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
        'PUBLISH_PAGE_FAILED',
        `Failed to publish page: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
