// apps/web/src/domains/share/shared/events/index.ts

import { PageId, UserId } from '../types';
import { PublishToken } from '../value-objects/publish-token.vo';

/**
 * DomainEvent 인터페이스
 */
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
  handle(): Promise<void>;
}

/**
 * 페이지가 게시되었을 때 발생하는 이벤트
 * (게시 = 링크 생성이므로 PublishLinkGeneratedEvent와 통합)
 */
export class PagePublishedEvent implements DomainEvent {
  readonly type = 'PagePublished';

  constructor(
    public readonly pageId: PageId,
    public readonly publisherId: UserId,
    public readonly publishToken: PublishToken,
    public readonly publishedAt: Date,
    public readonly occurredAt: Date = new Date()
  ) { }

  /**
   * Event 발생 시 Policy 실행
   * Event Storming의 Policy와 1:1 매칭
   *
   * ✅ Policy는 부수 효과이므로 실패해도 Aggregate에 영향 없음
   * ✅ 실패한 Policy는 나중에 재시도 가능
   */
  async handle(): Promise<void> {
    // console.log('[Share Management] Page Published:', {
    //   pageId: this.pageId,
    //   ownerId: this.ownerId,
    //   publishToken: this.publishToken.toString(),
    //   publishedAt: this.publishedAt,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 게시 통계 업데이트
      // - 사용자 활동 추적
      // - 워크스페이스별 게시된 페이지 수 증가
    ]);
  }
}

/**
 * 페이지 게시가 취소되었을 때 발생하는 이벤트
 */
export class PageUnpublishedEvent implements DomainEvent {
  readonly type = 'PageUnpublished';

  constructor(
    public readonly pageId: PageId,
    public readonly publisherId: UserId,
    public readonly publishToken: PublishToken,
    public readonly unpublishedAt: Date,
    public readonly occurredAt: Date = new Date()
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    // console.log('[Share Management] Page Unpublished:', {
    //   pageId: this.pageId,
    //   ownerId: this.ownerId,
    //   publishToken: this.publishToken.toString(),
    //   unpublishedAt: this.unpublishedAt,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 게시 취소 통계 업데이트
      // - 사용자 활동 추적
      // - 워크스페이스별 게시된 페이지 수 감소
    ]);
  }
}

