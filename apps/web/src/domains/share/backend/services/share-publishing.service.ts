// apps/web/src/domains/share/backend/services/share-publishing.service.ts

import { PublishPageCommand } from '../../shared/commands';
import { PublishResult } from '../../shared/dtos';
import { PublishedPageAggregate } from '../../shared/aggregates/published-page.aggregate';
import { PublishedPageRepository } from '../repositories/interfaces/published-page.repository.interface';
import { ShareManagementError } from '../../shared/errors/share-management.error';
import {
  PagePublishedEvent,
  PublishLinkAccessedEvent,
} from '../../shared/events';

export class SharePublishingService {
  constructor(private readonly publishedPageRepository: PublishedPageRepository) { }

  async publishPage(command: PublishPageCommand): Promise<PublishResult> {
    // 1. Aggregate 생성 및 커맨드 실행
    const aggregate = new PublishedPageAggregate();
    const publishedPage = aggregate.publish(command);

    // 2. Entity 저장
    try {
      await this.publishedPageRepository.save(publishedPage);
    } catch (saveError) {
      console.error(
        '❌ [SharePublishingService] Failed to save published page:',
        saveError
      );
      throw saveError instanceof Error
        ? saveError
        : new Error('Failed to save published page');
    }

    // 3. 이벤트 핸들러 실행 (Share Management 도메인 내부)
    const events = aggregate.getUncommittedEvents();
    await this.handleDomainEvents(events);

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

  async unpublishPage(pageId: string, userId: string): Promise<void> {
    const publishedPage = await this.publishedPageRepository.findByPageId(pageId);

    if (!publishedPage) {
      throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
    }

    if (publishedPage.ownerId !== userId) {
      throw new ShareManagementError('NOT_PAGE_OWNER', 'Not page owner');
    }

    // Soft unpublish: 상태만 변경, 레코드는 유지
    publishedPage.unpublish();
    await this.publishedPageRepository.save(publishedPage);
  }

  /**
   * 도메인 이벤트 처리 (Share Management 도메인 내부)
   */
  private async handleDomainEvents(
    events: Array<PagePublishedEvent | PublishLinkAccessedEvent>
  ): Promise<void> {
    const results = await Promise.allSettled(
      events.map(async (event) => {
        if (event.type === 'PagePublished') {
          return await this.handlePagePublished(event);
        } else if (event.type === 'PublishLinkAccessed') {
          return await this.handlePublishLinkAccessed(event);
        }
        return Promise.resolve();
      })
    );

    const failures = results.filter(
      (result) => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[SharePublishingService] ${failures.length} event handler(s) failed:`,
        failures.map((f) => f.reason)
      );
    }
  }

  /**
   * Policy: 페이지가 게시되었을 때
   */
  private async handlePagePublished(event: PagePublishedEvent): Promise<void> {
    console.log('[Share Management] Page Published:', {
      pageId: event.pageId,
      ownerId: event.ownerId,
      publishToken: event.publishToken,
      publishedAt: event.publishedAt,
    });

    // Policy 구현 예시:
    // - 알림 전송 (소유자에게 "페이지가 게시되었습니다")
    // - 통계 업데이트 (게시된 페이지 수 증가)
    // - 검색 인덱스 업데이트 (공개 페이지 검색 가능하게)
    // - 링크 생성 로그 (분석용)
  }

  /**
   * Policy: 게시 링크가 접근되었을 때
   */
  private async handlePublishLinkAccessed(
    event: PublishLinkAccessedEvent
  ): Promise<void> {
    console.log('[Share Management] Publish Link Accessed:', {
      publishToken: event.publishToken,
    });

    // Policy 구현 예시:
    // - 조회수 증가
    // - 접근 로그 기록
    // - 인기 콘텐츠 통계 업데이트
  }
}
