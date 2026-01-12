// apps/web/src/domains/share/backend/services/publish-page.ts

import { PublishPageRequest, PublishResultDTO } from '../../shared/dtos';
import { PublishedPageAggregate } from '../../shared/aggregates/published-page.aggregate';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import {
  PagePublishedEvent,
  PublishLinkAccessedEvent,
} from '../../shared/events';

export async function publishPage(
  safeDto: PublishPageRequest,
  requesterId: string,
  publishedPageRepository: PublishedPageRepository
): Promise<PublishResultDTO> {
  // 1. Aggregate 생성 및 커맨드 실행
  const aggregate = new PublishedPageAggregate();
  const publishedPage = aggregate.publish({
    pageId: safeDto.pageId,
    requesterId,
  });

  // 2. Entity 저장
  try {
    await publishedPageRepository.save(publishedPage);
  } catch (saveError) {
    console.error(
      '❌ [publishPage] Failed to save published page:',
      saveError
    );
    throw saveError instanceof Error
      ? saveError
      : new Error('Failed to save published page');
  }

  // 3. 이벤트 핸들러 실행 (Share Management 도메인 내부)
  const events = aggregate.getUncommittedEvents();
  await handleDomainEvents(events);

  // 4. 이벤트 커밋
  aggregate.markEventsAsCommitted();

  // 5. 결과 반환
  const publishToken = publishedPage.publishToken.toString();
  return {
    pageId: publishedPage.pageId,
    publishToken,
    publishUrl: `/p/${publishToken}`,
    publishedAt: publishedPage.publishedAt.toISOString(),
  };
}

/**
 * 도메인 이벤트 처리 (Share Management 도메인 내부) - Helper function
 */
async function handleDomainEvents(
  events: Array<PagePublishedEvent | PublishLinkAccessedEvent>
): Promise<void> {
  const results = await Promise.allSettled(
    events.map(async (event) => {
      if (event.type === 'PagePublished') {
        return await handlePagePublished(event);
      } else if (event.type === 'PublishLinkAccessed') {
        return await handlePublishLinkAccessed(event);
      }
      return Promise.resolve();
    })
  );

  const failures = results.filter(
    (result) => result.status === 'rejected'
  ) as PromiseRejectedResult[];

  if (failures.length > 0) {
    console.warn(
      `[publishPage] ${failures.length} event handler(s) failed:`,
      failures.map((f) => f.reason)
    );
  }
}

async function handlePagePublished(event: PagePublishedEvent): Promise<void> {
  console.log('[Share Management] Page Published:', {
    pageId: event.pageId,
    ownerId: event.ownerId,
    publishToken: event.publishToken,
    publishedAt: event.publishedAt,
  });
}

async function handlePublishLinkAccessed(
  event: PublishLinkAccessedEvent
): Promise<void> {
  console.log('[Share Management] Publish Link Accessed:', {
    publishToken: event.publishToken,
  });
}
