// apps/web/src/domains/share/shared/aggregates/published-page.aggregate.ts

import { PublishPageCommand, UnpublishPageCommand } from '../commands';
import { PublishedPage } from '../entities/published-page.entity';
import {
  PagePublishedEvent,
  PageUnpublishedEvent,
} from '../events';
import { ShareManagementError } from '../errors/share-management.error';

export class PublishedPageAggregate {
  private readonly events: Array<
    PagePublishedEvent | PageUnpublishedEvent
  > = [];

  /**
   * 페이지 게시 (Static 팩토리 메서드)
   * 
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity의 비즈니스 로직 사용
   * - Command → Event 1:1 대응
   */
  static publish(command: PublishPageCommand): PublishedPageAggregate {
    if (!command.publisherId) {
      throw new ShareManagementError('INVALID_REQUEST', 'Missing publisher');
    }

    // Entity 생성 (비즈니스 로직 포함)
    const publishedPage = PublishedPage.create(
      command.pageId,
      command.publisherId
    );

    // Entity의 publish 메서드 호출 (비즈니스 로직 검증)
    publishedPage.publish(command.publisherId);

    // Aggregate 생성
    const aggregate = new PublishedPageAggregate(publishedPage);

    // Domain Event 발생 (Command → Event 1:1 대응)
    aggregate.addDomainEvent(
      new PagePublishedEvent(
        publishedPage.pageId,
        publishedPage.ownerId,
        publishedPage.publishToken,
        publishedPage.publishedAt
      )
    );

    return aggregate;
  }

  /**
   * Aggregate 재구성 (기존 PublishedPage Entity로부터)
   */
  static reconstitute(publishedPage: PublishedPage): PublishedPageAggregate {
    return new PublishedPageAggregate(publishedPage);
  }

  private constructor(private readonly publishedPage: PublishedPage) {}

  /**
   * 페이지 게시 취소 (인스턴스 메서드)
   * 
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity의 비즈니스 로직 사용
   * - Command → Event 1:1 대응
   */
  unpublish(command: UnpublishPageCommand): void {
    const unpublishedAt = new Date();

    // Entity 상태 변경 (비즈니스 로직 포함)
    this.publishedPage.unpublish(command.publisherId);

    // Domain Event 발생 (Command → Event 1:1 대응)
    this.addDomainEvent(
      new PageUnpublishedEvent(
        this.publishedPage.pageId,
        this.publishedPage.ownerId,
        this.publishedPage.publishToken,
        unpublishedAt
      )
    );
  }

  getPublishedPage(): PublishedPage {
    return this.publishedPage;
  }

  private addDomainEvent(
    event: PagePublishedEvent | PageUnpublishedEvent
  ): void {
    this.events.push(event);
  }

  getUncommittedEvents(): Array<
    PagePublishedEvent | PageUnpublishedEvent
  > {
    return [...this.events];
  }

  markEventsAsCommitted(): void {
    this.events.length = 0;
  }
}
